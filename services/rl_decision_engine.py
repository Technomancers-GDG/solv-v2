"""
Reinforcement Learning Decision Engine for Supply Chain Optimization.
Implements a lightweight DQN-style agent using numpy that learns optimal
reroute policies from simulation outcomes.
"""
from __future__ import annotations

import json
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np

from config import settings


@dataclass(slots=True)
class StateVector:
    """Compact state representation for the RL agent."""

    utilization_norm: float  # 0-1 normalized facility utilization
    route_risk: float  # 0-1 closure risk
    eta_multiplier: float  # 1.0+ delay factor
    sla_urgency: float  # 0-1 how close to SLA breach
    payload_norm: float  # 0-1 normalized payload vs capacity
    priority_norm: float  # 0-1 normalized priority
    port_pressure: float  # 0-1 port spillover pressure
    weather_severity: float  # 0-1 weather impact
    news_severity: float  # 0-1 news impact
    time_of_day: float  # 0-1 hour normalized

    def to_array(self) -> np.ndarray:
        return np.array(
            [
                self.utilization_norm,
                self.route_risk,
                self.eta_multiplier - 1.0,
                self.sla_urgency,
                self.payload_norm,
                self.priority_norm,
                self.port_pressure,
                self.weather_severity,
                self.news_severity,
                self.time_of_day,
            ],
            dtype=np.float32,
        )

    @classmethod
    def from_sim_context(
        cls,
        *,
        facility_utilization: float,
        route_risk: float,
        eta_multiplier: float,
        sla_remaining_minutes: float,
        sla_total_minutes: float,
        payload_capacity: int,
        facility_capacity: int,
        priority: int,
        port_pressure: float,
        weather_severity: float,
        news_severity: float,
        simulation_hour: int,
    ) -> "StateVector":
        return cls(
            utilization_norm=min(1.0, max(0.0, facility_utilization)),
            route_risk=min(1.0, max(0.0, route_risk)),
            eta_multiplier=max(1.0, eta_multiplier),
            sla_urgency=min(
                1.0, max(0.0, 1.0 - (sla_remaining_minutes / max(sla_total_minutes, 1)))
            ),
            payload_norm=min(1.0, max(0.0, payload_capacity / max(facility_capacity, 1))),
            priority_norm=min(1.0, priority / 5.0),
            port_pressure=min(1.0, max(0.0, port_pressure)),
            weather_severity=min(1.0, max(0.0, weather_severity)),
            news_severity=min(1.0, max(0.0, news_severity)),
            time_of_day=simulation_hour / 24.0,
        )


class ReplayBuffer:
    def __init__(self, capacity: int = 5000) -> None:
        self.capacity = capacity
        self.buffer: list[tuple[np.ndarray, int, float, np.ndarray, bool]] = []
        self.position = 0

    def push(self, state: np.ndarray, action: int, reward: float, next_state: np.ndarray, done: bool) -> None:
        if len(self.buffer) < self.capacity:
            self.buffer.append((state, action, reward, next_state, done))
        else:
            self.buffer[self.position] = (state, action, reward, next_state, done)
        self.position = (self.position + 1) % self.capacity

    def sample(self, batch_size: int) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray] | None:
        if len(self.buffer) < batch_size:
            return None
        batch = random.sample(self.buffer, batch_size)
        states, actions, rewards, next_states, dones = zip(*batch)
        return (
            np.stack(states),
            np.array(actions, dtype=np.int64),
            np.array(rewards, dtype=np.float32),
            np.stack(next_states),
            np.array(dones, dtype=np.float32),
        )

    def __len__(self) -> int:
        return len(self.buffer)


class QNetwork:
    """Simple feed-forward Q-network using numpy."""

    def __init__(self, input_dim: int = 10, hidden_dim: int = 64, output_dim: int = 5) -> None:
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.output_dim = output_dim
        # Xavier-ish init
        self.W1 = np.random.randn(input_dim, hidden_dim).astype(np.float32) * np.sqrt(2.0 / input_dim)
        self.b1 = np.zeros(hidden_dim, dtype=np.float32)
        self.W2 = np.random.randn(hidden_dim, hidden_dim).astype(np.float32) * np.sqrt(2.0 / hidden_dim)
        self.b2 = np.zeros(hidden_dim, dtype=np.float32)
        self.W3 = np.random.randn(hidden_dim, output_dim).astype(np.float32) * np.sqrt(2.0 / hidden_dim)
        self.b3 = np.zeros(output_dim, dtype=np.float32)

    def forward(self, x: np.ndarray) -> np.ndarray:
        # x: (batch, input_dim) or (input_dim,)
        single = x.ndim == 1
        if single:
            x = x.reshape(1, -1)
        h1 = np.maximum(0, x @ self.W1 + self.b1)
        h2 = np.maximum(0, h1 @ self.W2 + self.b2)
        q = h2 @ self.W3 + self.b3
        return q[0] if single else q

    def copy_from(self, other: "QNetwork") -> None:
        self.W1 = other.W1.copy()
        self.b1 = other.b1.copy()
        self.W2 = other.W2.copy()
        self.b2 = other.b2.copy()
        self.W3 = other.W3.copy()
        self.b3 = other.b3.copy()

    def get_params(self) -> dict[str, Any]:
        return {
            "W1": self.W1.tolist(),
            "b1": self.b1.tolist(),
            "W2": self.W2.tolist(),
            "b2": self.b2.tolist(),
            "W3": self.W3.tolist(),
            "b3": self.b3.tolist(),
        }

    def set_params(self, params: dict[str, Any]) -> None:
        self.W1 = np.array(params["W1"], dtype=np.float32)
        self.b1 = np.array(params["b1"], dtype=np.float32)
        self.W2 = np.array(params["W2"], dtype=np.float32)
        self.b2 = np.array(params["b2"], dtype=np.float32)
        self.W3 = np.array(params["W3"], dtype=np.float32)
        self.b3 = np.array(params["b3"], dtype=np.float32)


class RLDecisionEngine:
    """
    DQN-based decision engine that learns optimal dispatch decisions.
    Actions: 0=continue, 1=reroute_warehouse, 2=reroute_port, 3=wait, 4=defer
    """

    ACTIONS = ["continue", "reroute_warehouse", "reroute_port", "wait", "defer_dispatch"]

    def __init__(self, model_path: Path | None = None) -> None:
        self.q_network = QNetwork(input_dim=10, hidden_dim=64, output_dim=5)
        self.target_network = QNetwork(input_dim=10, hidden_dim=64, output_dim=5)
        self.target_network.copy_from(self.q_network)
        self.replay_buffer = ReplayBuffer(capacity=8000)
        self.gamma = 0.95
        self.epsilon = 1.0
        self.epsilon_min = 0.05
        self.epsilon_decay = 0.995
        self.learning_rate = 0.001
        self.batch_size = 32
        self.target_update_freq = 200
        self.train_step = 0
        self.model_path = model_path or Path(settings.rl_model_path)
        self._load_weights()

    def _load_weights(self) -> None:
        if self.model_path.exists():
            try:
                with self.model_path.open("r", encoding="utf-8") as f:
                    data = json.load(f)
                self.q_network.set_params(data["q_network"])
                self.target_network.set_params(data["target_network"])
                self.epsilon = max(self.epsilon_min, data.get("epsilon", 1.0))
                self.train_step = data.get("train_step", 0)
                print(f"[RL] Loaded weights from {self.model_path}")
            except Exception as exc:
                print(f"[RL] Could not load weights: {exc}. Starting fresh.")

    def save_weights(self) -> None:
        data = {
            "q_network": self.q_network.get_params(),
            "target_network": self.target_network.get_params(),
            "epsilon": float(self.epsilon),
            "train_step": self.train_step,
        }
        self.model_path.parent.mkdir(parents=True, exist_ok=True)
        with self.model_path.open("w", encoding="utf-8") as f:
            json.dump(data, f)

    def select_action(self, state: StateVector, valid_actions: list[str] | None = None) -> tuple[str, float]:
        state_arr = state.to_array()
        valid = valid_actions or self.ACTIONS
        valid_indices = [self.ACTIONS.index(a) for a in valid if a in self.ACTIONS]
        if not valid_indices:
            valid_indices = [0]

        if random.random() < self.epsilon:
            action_idx = random.choice(valid_indices)
        else:
            q_values = self.q_network.forward(state_arr)
            masked = np.full_like(q_values, -1e9)
            masked[valid_indices] = q_values[valid_indices]
            action_idx = int(np.argmax(masked))

        return self.ACTIONS[action_idx], float(self.q_network.forward(state_arr)[action_idx])

    def compute_reward(
        self,
        *,
        sla_met: bool,
        overflow_avoided: bool,
        co2_delta: float,
        idle_minutes: float,
        stockout_prevented: bool,
        reroute_successful: bool,
    ) -> float:
        reward = 0.0
        if sla_met:
            reward += 10.0
        else:
            reward -= 8.0
        if overflow_avoided:
            reward += 5.0
        if stockout_prevented:
            reward += 15.0
        if reroute_successful:
            reward += 3.0
        reward -= co2_delta * 0.5
        reward -= idle_minutes * 0.1
        return reward

    def train_step_update(self) -> dict[str, float] | None:
        batch = self.replay_buffer.sample(self.batch_size)
        if batch is None:
            return None
        states, actions, rewards, next_states, dones = batch

        # Forward pass
        h1 = np.maximum(0, states @ self.q_network.W1 + self.q_network.b1)
        h2 = np.maximum(0, h1 @ self.q_network.W2 + self.q_network.b2)
        q_pred = h2 @ self.q_network.W3 + self.q_network.b3

        # Target Q-values
        h1_t = np.maximum(0, next_states @ self.target_network.W1 + self.target_network.b1)
        h2_t = np.maximum(0, h1_t @ self.target_network.W2 + self.target_network.b2)
        q_next = h2_t @ self.target_network.W3 + self.target_network.b3
        max_q_next = np.max(q_next, axis=1)
        targets = rewards + self.gamma * max_q_next * (1.0 - dones)

        # MSE loss gradient w.r.t Q-values
        q_target_full = q_pred.copy()
        q_target_full[np.arange(self.batch_size), actions] = targets
        loss_grad = 2 * (q_pred - q_target_full) / self.batch_size

        # Backprop through network
        grad_h2 = loss_grad @ self.q_network.W3.T
        grad_h2[h2 <= 0] = 0
        grad_h1 = grad_h2 @ self.q_network.W2.T
        grad_h1[h1 <= 0] = 0

        # Weight updates
        self.q_network.W3 -= self.learning_rate * (h2.T @ loss_grad)
        self.q_network.b3 -= self.learning_rate * np.sum(loss_grad, axis=0)
        self.q_network.W2 -= self.learning_rate * (h1.T @ grad_h2)
        self.q_network.b2 -= self.learning_rate * np.sum(grad_h2, axis=0)
        self.q_network.W1 -= self.learning_rate * (states.T @ grad_h1)
        self.q_network.b1 -= self.learning_rate * np.sum(grad_h1, axis=0)

        self.train_step += 1
        if self.train_step % self.target_update_freq == 0:
            self.target_network.copy_from(self.q_network)

        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)
        loss = float(np.mean((q_pred - q_target_full) ** 2))
        return {"loss": loss, "epsilon": self.epsilon, "train_step": self.train_step}

    def store_transition(self, state: StateVector, action: str, reward: float, next_state: StateVector, done: bool) -> None:
        self.replay_buffer.push(
            state.to_array(),
            self.ACTIONS.index(action),
            reward,
            next_state.to_array(),
            done,
        )

    def get_action_confidence(self, state: StateVector) -> dict[str, float]:
        q_values = self.q_network.forward(state.to_array())
        exp_q = np.exp(q_values - np.max(q_values))
        probs = exp_q / np.sum(exp_q)
        return {action: float(probs[i]) for i, action in enumerate(self.ACTIONS)}


# Singleton instance
rl_engine_instance: RLDecisionEngine | None = None


def get_rl_engine() -> RLDecisionEngine:
    global rl_engine_instance
    if rl_engine_instance is None:
        rl_engine_instance = RLDecisionEngine()
    return rl_engine_instance
