# Gemini Integration Guide

## Overview

The enhanced Gemini integration provides a multi-stage decision-support layer for your logistics system:

```
Multiple News → Risk Analysis → Route Impact → Driver Messaging → Simulation Events
```

All functions are in `backend/utils/gemini_client.py` and have built-in error handling with fallbacks.

---

## Functions Reference

### 1. `analyze_news_with_gemini(text: str) -> dict | None`
**Purpose:** Single-news disruption analysis  
**Input:** Raw news text  
**Output:**
```json
{
  "event_type": "protest",
  "severity": "high",
  "location": "Chennai",
  "summary": "Major protest blocks ring road"
}
```
**Use case:** Existing pipeline (News Relevance Service)

---

### 2. `analyze_multiple_news(news_list: list[str]) -> dict | None`
**Purpose:** Fuse multiple news signals into unified risk assessment  
**Input:** List of news headlines  
**Output:**
```json
{
  "event_type": "logistics_disruption",
  "severity": "high",
  "affected_regions": ["Chennai", "Bangalore"],
  "risk_score": 0.78,
  "confidence": 0.92,
  "reasoning": "Multiple traffic incidents reported across key routes"
}
```
**Use case:** Real-time disruption aggregation  
**Location to integrate:** `services/simulation.py` (in `dashboard_snapshot()` or new aggregation function)

---

### 3. `analyze_route_impact(route: str, disruption_data: dict) -> dict | None`
**Purpose:** Determine if a specific route is affected and recommend action  
**Input:**  
- `route`: "Bangalore → Chennai" or route identifier
- `disruption_data`: Output from `analyze_multiple_news()`

**Output:**
```json
{
  "impact": "high",
  "recommended_action": "reroute",
  "reason": "Multiple incidents on main highway; suggest alternate via toll road"
}
```
**Use case:** Real-time route recommendations  
**Location to integrate:** `services/rl_decision_engine.py` (before finalizing route decisions)

---

### 4. `generate_driver_message(decision: dict, disruption_data: dict) -> str`
**Purpose:** Create friendly, non-technical driver explanations  
**Input:**
- `decision`: From route impact analysis
- `disruption_data`: From `analyze_multiple_news()`

**Output:**
```
"Traffic incident reported on your route. Taking you via the bypass to save 10 minutes. Stay safe!"
```
**Use case:** Driver notifications  
**Location to integrate:** `main.py` (when sending recommendations to drivers)

---

### 5. `generate_simulation_event(news_text: str) -> dict | None`
**Purpose:** Convert news into structured simulation events  
**Input:** Raw news text  
**Output:**
```json
{
  "event": "Road blockage - protest",
  "severity": "high",
  "location": "Chennai",
  "estimated_duration_hours": 4
}
```
**Use case:** Simulation engine event generation  
**Location to integrate:** `services/simulation.py` (in event injection pipeline)

---

## Integration Points

### A. News Event Aggregation (Real-time)
**File:** `services/simulation.py`

```python
from backend.utils.gemini_client import analyze_multiple_news

# In dashboard_snapshot() or new function:
def get_active_disruptions(session: Session) -> dict | None:
    # Fetch recent relevant news events (last 24 hours)
    recent_news = session.scalars(
        select(NewsEvent)
        .where(NewsEvent.relevant == True)
        .order_by(NewsEvent.created_at.desc())
        .limit(10)
    ).all()
    
    if not recent_news:
        return None
    
    headlines = [f"{e.city}: {e.headline}" for e in recent_news]
    return analyze_multiple_news(headlines)
```

---

### B. Route Decision Enhancement
**File:** `services/rl_decision_engine.py` or `services/simulation.py`

```python
from backend.utils.gemini_client import analyze_route_impact

# When making route recommendation:
def recommend_route(vehicle_id: int, current_location: str, destination: str):
    # Get active disruptions
    disruption = get_active_disruptions(session)  # from A above
    
    if disruption and disruption['risk_score'] > 0.5:
        route_str = f"{current_location} → {destination}"
        impact = analyze_route_impact(route_str, disruption)
        
        if impact and impact['recommended_action'] != 'continue':
            # Apply reroute or delay
            logger.info(f"Route modification: {impact['reason']}")
            # Update recommendation
```

---

### C. Driver Messaging
**File:** `main.py` (in recommendations endpoint or WebSocket handler)

```python
from backend.utils.gemini_client import generate_driver_message

@app.post("/api/recommendations/{rec_id}/accept")
async def accept_recommendation(rec_id: int, session: Session = Depends(get_session)):
    rec = session.get(Recommendation, rec_id)
    disruption_data = get_active_disruptions(session)
    
    if disruption_data:
        message = generate_driver_message(
            {"recommended_action": rec.action},
            disruption_data
        )
        # Send via WebSocket or notification system
        await send_to_driver(rec.vehicle_id, message)
```

---

### D. Simulation Event Generation
**File:** `services/event_ingestion.py`

```python
from backend.utils.gemini_client import generate_simulation_event

def import_news(self, session: Session, ...):
    # In the loop where you process news:
    for row in rows:
        headline = row.get("News") or ""
        
        # Generate structured simulation event
        sim_event_data = generate_simulation_event(headline)
        
        if sim_event_data:
            # Can store in SimEvent table if desired
            logger.info(f"Simulation event: {sim_event_data['event']}")
        
        # Continue with existing news import logic
```

---

## Error Handling & Fallbacks

### Built-in Fallback Strategy

All functions gracefully degrade:

1. **If Gemini API unavailable** → Returns `None`
2. **If API key missing** → Logs warning, returns `None`
3. **If invalid JSON** → Retries once, then returns `None`
4. **If response validation fails** → Logs error, returns `None`

**Usage pattern:**
```python
result = analyze_multiple_news(news_list)

if result is None:
    # Fallback to existing NLP logic
    logger.info("Falling back to NLP pipeline")
    result = fallback_nlp_analysis(news_list)
```

---

## Configuration & Debugging

### Enable Debug Logging
```bash
# In your environment
export GEMINI_DEBUG=true

# Then log output will show:
# - Raw Gemini responses
# - Parsed JSON
# - Retry attempts
# - Validation details
```

### API Key Setup
Already configured in `config.py`:
```python
gemini_api_key=_get_env("GEMINI_API_KEY", "<your-gemini-api-key>"),
```

---

## Performance Considerations

- **Latency:** Each function makes 1 Gemini API call (±500-1000ms)
- **Concurrency:** Safe to call from multiple threads (google-genai client is thread-safe)
- **Caching:** Consider caching disruption analysis for 5-10 minutes
- **Batch processing:** `analyze_multiple_news()` processes up to 10 news items in single call

---

## Testing Functions

### Quick Local Test
```python
from backend.utils.gemini_client import *

# Test multi-news
news = [
    "Major traffic jam on Chennai ring road due to accident",
    "Logistics strike announced in Bangalore area",
    "Heavy rain forecast for coastal regions"
]

result = analyze_multiple_news(news)
print(result)

# Test route impact
if result:
    impact = analyze_route_impact("Chennai → Bangalore", result)
    print(impact)

# Test driver message
if impact:
    msg = generate_driver_message(impact, result)
    print(msg)

# Test simulation event
event = generate_simulation_event(news[0])
print(event)
```

---

## Backward Compatibility

✅ **All existing code continues to work unchanged:**
- `analyze_news_with_gemini()` still works for single-news analysis
- `NewsRelevanceService` continues to use it for classification
- Existing decision engine logic unaffected

✅ **New functions are purely additive:**
- No breaking changes to models, schemas, or APIs
- Integrate incrementally at your own pace
- Mix and match Gemini calls with existing NLP pipeline

---

## Best Practices

1. **Always check for `None`** return values
2. **Log disruption data** for debugging and audit
3. **Cache multi-news analysis** to avoid redundant API calls
4. **Use debug mode** during development
5. **Test with real news data** from your dataset
6. **Monitor API costs** (Gemini is billed per call)

---

## Next Steps

1. ✅ Review `backend/utils/gemini_client.py` for all functions
2. ✅ Choose integration point(s) that fit your priority
3. ✅ Add test routes with `analyze_multiple_news()` + `analyze_route_impact()`
4. ✅ Send driver messages via existing notification system
5. ✅ Monitor logs and refine prompts as needed

---

## Support Reference

- Gemini API Docs: https://ai.google.dev/
- Model used: `gemini-2.5-flash`
- Fallback mechanism: Graceful degradation to NLP pipeline
- Debug flag: `GEMINI_DEBUG=true`

