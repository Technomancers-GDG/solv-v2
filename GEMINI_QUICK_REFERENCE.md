# Gemini Integration Quick Reference

## Function Signatures

```python
# Single news (existing)
analyze_news_with_gemini(text: str) -> dict | None

# Multi-news (NEW)
analyze_multiple_news(news_list: list[str]) -> dict | None

# Route impact (NEW)
analyze_route_impact(route: str, disruption_data: dict) -> dict | None

# Driver message (NEW)
generate_driver_message(decision: dict, disruption_data: dict) -> str

# Simulation event (NEW)
generate_simulation_event(news_text: str) -> dict | None
```

---

## Import Statement

```python
from backend.utils.gemini_client import (
    analyze_news_with_gemini,
    analyze_multiple_news,
    analyze_route_impact,
    generate_driver_message,
    generate_simulation_event
)
```

---

## Basic Usage Pattern

```python
# 1. Aggregate multiple news
disruption = analyze_multiple_news([
    "Traffic jam on highway",
    "Strike announced",
    "Heavy rain forecast"
])

# 2. Check for None (error handling)
if disruption is None:
    print("Gemini failed, using NLP fallback")
    disruption = fallback_nlp_analysis()

# 3. Analyze impact on route
impact = analyze_route_impact("City A → City B", disruption)

# 4. Generate driver message
if impact:
    message = generate_driver_message(impact, disruption)

# 5. Create simulation event
event = generate_simulation_event("Traffic accident reported")
```

---

## Return Value Shapes

### `analyze_multiple_news()` Returns:
```python
{
    "event_type": "logistics_disruption",
    "severity": "high",  # "low" | "medium" | "high"
    "affected_regions": ["Chennai", "Bangalore"],
    "risk_score": 0.78,  # 0.0 - 1.0
    "confidence": 0.92,  # 0.0 - 1.0
    "reasoning": "Multiple incidents on main corridor"
}
```

### `analyze_route_impact()` Returns:
```python
{
    "impact": "high",  # "low" | "medium" | "high"
    "recommended_action": "reroute",  # "continue" | "reroute" | "delay"
    "reason": "Multiple incidents on main highway"
}
```

### `generate_driver_message()` Returns:
```python
"Traffic incident reported on your route. Taking alternate route. Stay safe!"
```

### `generate_simulation_event()` Returns:
```python
{
    "event": "Road blockage - protest",
    "severity": "high",  # "low" | "medium" | "high"
    "location": "Chennai",
    "estimated_duration_hours": 4
}
```

---

## Error Handling Pattern

```python
# All functions return None on error
result = analyze_multiple_news(news_list)

# Always check for None first
if result is None:
    # Use fallback logic
    result = your_fallback_function()
    logger.info("Gemini unavailable, using NLP fallback")
else:
    # Use Gemini result
    logger.info(f"Gemini analysis: {result}")
```

---

## Integration Locations

| Function | Integration Point | File |
|----------|------------------|------|
| `analyze_news_with_gemini()` | NewsRelevanceService.predict() | services/news_relevance.py |
| `analyze_multiple_news()` | SimulationEngine.dashboard_snapshot() | services/simulation.py |
| `analyze_route_impact()` | RL Decision Engine / Recommendation Logic | services/rl_decision_engine.py |
| `generate_driver_message()` | Recommendations endpoint | main.py |
| `generate_simulation_event()` | Event ingestion pipeline | services/event_ingestion.py |

---

## Configuration

### Enable Debug Logging
```bash
# In PowerShell
$env:GEMINI_DEBUG = "true"

# In .env file
GEMINI_DEBUG=true
```

### Verify API Key
```python
from config import settings
print(f"API Key set: {bool(settings.gemini_api_key)}")
```

---

## Common Patterns

### Pattern 1: Disruption Aggregation
```python
# Get last N news events
recent_news = [e.headline for e in news_events[-10:]]

# Fuse into unified assessment
disruption = analyze_multiple_news(recent_news)

# Log for monitoring
if disruption and disruption['risk_score'] > 0.7:
    logger.warning(f"High risk: {disruption['reasoning']}")
```

### Pattern 2: Route Decision
```python
# For each active route
for vehicle in active_vehicles:
    route = f"{vehicle.current_location} → {vehicle.destination}"
    impact = analyze_route_impact(route, disruption)
    
    if impact and impact['recommended_action'] != 'continue':
        # Apply reroute or delay
        update_recommendation(vehicle, impact)
```

### Pattern 3: Driver Notification
```python
# After recommendation accepted
message = generate_driver_message(
    {"recommended_action": "reroute"},
    active_disruption
)

# Send via WebSocket/push
await send_to_driver(vehicle_id, message)
```

### Pattern 4: Simulation Event Injection
```python
# For high-impact news
if news.impact_score > 0.8:
    sim_event = generate_simulation_event(news.headline)
    
    if sim_event:
        # Inject into simulation
        simulation_engine.inject_event(sim_event)
```

---

## Testing Commands

### Quick Single Test
```bash
python -c "
from backend.utils.gemini_client import analyze_news_with_gemini
result = analyze_news_with_gemini('Major accident on highway')
print(result)
"
```

### Full Flow Test
```python
# Run this in Python shell
from backend.utils.gemini_client import *

news = [
    "Traffic jam on Chennai ring road",
    "Strike announced in logistics sector",
    "Heavy rain forecast for region"
]

d = analyze_multiple_news(news)
print('Disruption:', d)

i = analyze_route_impact("Chennai → Bangalore", d)
print('Impact:', i)

m = generate_driver_message(i, d)
print('Message:', m)

e = generate_simulation_event(news[0])
print('Event:', e)
```

---

## Debugging Checklist

- [ ] API key is set: `echo $GEMINI_API_KEY`
- [ ] google-genai installed: `pip list | grep google`
- [ ] Debug logging enabled: `echo $GEMINI_DEBUG`
- [ ] Check logs for "Gemini raw response"
- [ ] Verify JSON is valid: `python -m json.tool`
- [ ] Test with simple news first
- [ ] Monitor API call latency
- [ ] Check rate limiting headers

---

## Performance Tips

1. **Cache disruptions**: Reuse for 5-10 minutes
2. **Batch news**: Combine up to 10 items in one call
3. **Monitor latency**: Aim for <1s per call
4. **Limit route checks**: Only for affected areas
5. **Async calls**: Use FastAPI's `asyncio` for parallel analysis

---

## Fallback Strategy

```python
def safe_analyze(news_list):
    """Analyze with automatic fallback."""
    
    # Try Gemini first
    result = analyze_multiple_news(news_list)
    if result is not None:
        return result
    
    # Fallback to NLP
    logger.info("Gemini unavailable, using NLP")
    return nlp_pipeline.analyze(news_list)
```

---

## Monitoring Metrics

**Track these KPIs:**

```
1. Gemini call frequency (per hour)
2. Success rate (% returning non-None)
3. Average latency (ms)
4. Fallback rate (% using NLP)
5. Error rate (% exceptions)
6. API cost ($ per day)
```

---

## Documentation Files

| Document | Purpose |
|----------|---------|
| `GEMINI_INTEGRATION_GUIDE.md` | Detailed integration instructions |
| `GEMINI_INTEGRATION_EXAMPLES.md` | Code examples for each service |
| `GEMINI_ARCHITECTURE.md` | System design & data flows |
| `GEMINI_QUICK_REFERENCE.md` | This file - quick lookup |

---

## Support

- **API Docs**: https://ai.google.dev/
- **Model**: `gemini-2.5-flash`
- **Max input**: ~30K tokens per call
- **Response format**: JSON only (enforced)
- **Retry policy**: Auto-retry on JSON parse failure

---

## Pro Tips

✅ **Do:**
- Always check for `None` returns
- Log disruption data for audit trails
- Test with real news from your dataset
- Monitor API costs and latency
- Use caching for frequent analyses

❌ **Don't:**
- Ignore None returns without fallback
- Make Gemini calls in tight loops
- Assume JSON will always be valid
- Forget to handle network errors
- Deploy without testing

