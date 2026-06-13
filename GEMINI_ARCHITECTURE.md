# Gemini Integration Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      GEMINI-ENHANCED PIPELINE                  │
└─────────────────────────────────────────────────────────────────┘

Input: Multiple News Headlines
           ↓
    ┌──────────────────────────────┐
    │  analyze_multiple_news()     │
    │  Fuse signals into unified   │
    │  disruption understanding    │
    └──────────────────────────────┘
           ↓
    Disruption Data:
    - event_type
    - severity (low/medium/high)
    - affected_regions
    - risk_score (0-1)
    - confidence (0-1)
           ↓
    ┌──────────────────────────────┐
    │  analyze_route_impact()      │
    │  Determine impact on each    │
    │  active route                │
    └──────────────────────────────┘
           ↓
    Route Decision:
    - impact level
    - recommended_action
    - reasoning
           ↓
    ┌──────────────────────────────┐
    │ generate_driver_message()    │
    │ Create simple explanation    │
    │ for drivers (2 sentences)    │
    └──────────────────────────────┘
           ↓
    Driver notification sent
           ↓
    ┌──────────────────────────────┐
    │generate_simulation_event()   │
    │ Create structured event for  │
    │ simulation engine            │
    └──────────────────────────────┘
           ↓
    Simulation event injected
```

---

## Data Flow Diagram

```
NEWS SOURCES (Excel, Database)
        ↓
    ┌───────────────────────────────────────────────┐
    │  NewsRelevanceService (Existing)              │
    │  - Classify relevant/not relevant             │
    │  - Call analyze_news_with_gemini() for each   │
    │  - Return: event_type, severity, location     │
    └───────────────────────────────────────────────┘
        ↓
    NewsEvent Table
        ↓
        ├─→ [NEW] get_active_disruptions()
        │         Fetch recent + analyze_multiple_news()
        │         ↓
        │    Unified Risk Assessment
        │         ↓
        ├─→ [NEW] analyze_route_impact()
        │         For each active vehicle route
        │         ↓
        │    Route Decisions
        │         ↓
        ├─→ [NEW] generate_driver_message()
        │         ↓
        │    Driver Notifications
        │         ↓
        └─→ [NEW] generate_simulation_event()
                  Inject into SimulationEngine


LEGACY PIPELINE (UNCHANGED)
        ↓
    RL Decision Engine
        ↓
    Recommendations Table
        ↓
    Dashboard / Driver App
```

---

## Function Interaction Map

```
Single News Flow (Existing):
└─ analyze_news_with_gemini()  ← Used by NewsRelevanceService

Multi-News Flow (NEW):
├─ analyze_multiple_news()
│  └─ _call_gemini_json()  [helper]
│
├─ analyze_route_impact()
│  └─ _call_gemini_json()  [helper]
│
├─ generate_driver_message()
│  └─ _call_gemini_json()  [helper]
│
└─ generate_simulation_event()
   └─ _call_gemini_json()  [helper]
```

---

## Error Handling Flow

```
Any Gemini Function Called
        ↓
    Is API Key Set?
    ├─ NO  → Log warning → Return None
    └─ YES ↓
        Call _call_gemini_json()
        ├─ Network/API Error
        │  └─ Log error → Return None
        ├─ Invalid JSON (Attempt 1)
        │  └─ Retry (Attempt 2)
        ├─ Invalid JSON (Attempt 2)
        │  └─ Log error → Return None
        ├─ Valid JSON
        │  ├─ Validate Schema
        │  ├─ Bad Schema
        │  │  └─ Log warning → Return None
        │  └─ Good Schema
        │     ├─ Normalize values
        │     ├─ Normalize error
        │     │  └─ Log error → Return None
        │     └─ Return dict ✓
        │
Caller Code
├─ Check for None
├─ None: Use fallback (NLP pipeline)
└─ Dict: Use Gemini results
```

---

## State Machine: Disruption Response

```
┌────────────────────────────────────────────────────────┐
│           SIMULATION STATE DURING DISRUPTION           │
└────────────────────────────────────────────────────────┘

NORMAL STATE (no disruptions)
    ↑
    └─ risk_score < 0.3
        
ALERT STATE (potential disruption)
    ├─ risk_score: 0.3 - 0.6
    ├─ Action: Monitor routes
    ├─ analyze_route_impact() → impact: "low"
    └─ Recommendations: "continue as planned"
        
DISRUPTION STATE (active disruption)
    ├─ risk_score: 0.6 - 0.8
    ├─ Action: Reroute affected vehicles
    ├─ analyze_route_impact() → impact: "medium"
    └─ Recommendations: "reroute recommended"
        
CRITICAL STATE (severe disruption)
    ├─ risk_score: 0.8 - 1.0
    ├─ Action: Halt shipments in region
    ├─ analyze_route_impact() → impact: "high"
    ├─ Recommendations: "delay until cleared"
    └─ Driver Message: Urgent notification
        
    ├─ After disruption clears
    │  └─ risk_score drops below 0.5
    │     └─ State transitions back
    │
    └─ Every 5-10 minutes
       └─ Re-run get_active_disruptions()
          to update state
```

---

## API Endpoints Overview

### Existing Endpoints (Unchanged)
```
GET  /api/events/news?relevant_only=true
     Returns: List[NewsEventRead]

POST /api/recommendations
     Creates recommendations
     
GET  /api/recommendations
     Returns: List[RecommendationRead]
```

### New/Enhanced Endpoints (After Integration)

```
GET  /api/dashboard
     NOW INCLUDES:
     {
       "active_disruptions": {
         "event_type": "logistics_disruption",
         "risk_score": 0.75,
         "severity": "high",
         ...
       }
     }

POST /api/recommendations/{id}/send-to-driver  [NEW]
     Request: {}
     Response: {
       "success": true,
       "message": "Traffic incident reported on your route..."
     }

WS   /ws/disruptions  [NEW - OPTIONAL]
     Sends real-time disruption alerts
     Message: {
       "type": "disruption_alert",
       "data": {...disruption data...},
       "timestamp": "2026-04-28T10:30:00Z"
     }
```

---

## Database Schema Integration

### Existing Tables (Used)
```
- news_events
  └─ relevant, impact_type, impact_score, city, headline

- vehicles
  └─ current_facility_id, identifier, status

- facilities
  └─ city, latitude, longitude

- recommendations
  └─ vehicle_id, action, explanation, status
```

### New Usage Pattern
```
NewsEvent (existing)
    ↓ [10 recent events]
    └─ analyze_multiple_news()
       ↓
    Disruption Data (in-memory dict)
       ↓
    analyze_route_impact() [for each active route]
       ↓
    Route decisions applied to Recommendation logic
       ↓
    generate_driver_message()
       ↓
    Send to driver (via WebSocket/notification system)
```

**Note:** No new database tables needed! All results are in-memory during analysis.

---

## Configuration & Environment

### Required
```
GEMINI_API_KEY=AIzaSyCQKgbpYP_CZtCRl20yO4_1dVckyLGUd8o
```

### Optional
```
GEMINI_DEBUG=true    # Enable detailed logging
```

---

## Performance Characteristics

### Latency
- `analyze_news_with_gemini()`: 500-1000ms (single call)
- `analyze_multiple_news()`: 800-1500ms (aggregate 10 items)
- `analyze_route_impact()`: 500-1000ms (per route)
- `generate_driver_message()`: 300-700ms (quick generation)
- `generate_simulation_event()`: 500-1000ms (single call)

### Throughput
- All functions make **exactly 1 API call**
- No batching of Gemini requests
- Safe for concurrent use (thread-safe client)

### Cost (Gemini 2.5 Flash)
- Approximately $0.075 per 1M input tokens
- ~100-300 tokens per news analysis
- Estimated: **$0.00001-0.00002 per function call**

### Caching Recommendation
```python
# Cache disruption analysis for 5-10 minutes
DISRUPTION_CACHE_TTL = 300  # seconds

active_disruptions_cache = {}  # {timestamp: disruption_data}

def get_active_disruptions_cached(session):
    now = time.time()
    
    if "last_fetch" in active_disruptions_cache:
        if now - active_disruptions_cache["last_fetch"] < DISRUPTION_CACHE_TTL:
            return active_disruptions_cache.get("data")
    
    data = simulation_engine.get_active_disruptions(session)
    active_disruptions_cache = {
        "last_fetch": now,
        "data": data
    }
    return data
```

---

## Resilience & Fallbacks

### Scenario 1: Gemini API Unreachable
```
analyze_multiple_news() → None
    ↓
Caller detects None
    ↓
Falls back to existing NLP pipeline
    ↓
System continues operation
```

### Scenario 2: Invalid JSON from Gemini
```
_call_gemini_json() → Retry once
    ↓
Still invalid → Return None
    ↓
Caller handles None → Fallback
```

### Scenario 3: API Rate Limited
```
google-genai client handles auto-retry
    ↓
If exhausted → Exception
    ↓
Caught in try/except → Return None
    ↓
Fallback executed
```

---

## Monitoring & Logging

### Key Logs to Watch
```
[INFO] Gemini analysis successful: event_type=protest, severity=high
[INFO] Multi-news analysis successful: event_type=logistics_disruption, risk_score=0.75
[INFO] Route impact analysis: route=Chennai → Bangalore, impact=high, action=reroute
[WARNING] Gemini response missing expected keys
[ERROR] Gemini API call failed: <reason>
[DEBUG] Gemini raw response: {...}  [Only with GEMINI_DEBUG=true]
```

### Metrics to Track
```
- Total Gemini API calls (count)
- Success rate (%)
- Average latency (ms)
- Cache hit rate (if caching)
- Fallback rate (% using NLP instead)
```

---

## Deployment Checklist

- [ ] API key configured in `config.py`
- [ ] `backend/utils/gemini_client.py` updated with all 5 functions
- [ ] `google-genai` package installed in venv
- [ ] Test script runs successfully
- [ ] Debug logging verified with `GEMINI_DEBUG=true`
- [ ] Integration point in `services/simulation.py` added
- [ ] Driver messaging endpoint added to `main.py`
- [ ] WebSocket handler added (optional)
- [ ] Fallback logic verified
- [ ] Performance tested with real news data
- [ ] Rate limiting strategy determined
- [ ] Monitoring setup in place
- [ ] Documentation reviewed by team

---

## Troubleshooting

### Issue: "GEMINI_API_KEY not set"
**Solution:** Verify key is in `config.py` or environment variable

### Issue: "Invalid JSON: no such key"
**Solution:** Enable `GEMINI_DEBUG=true` to see raw response

### Issue: "NoneType returned"
**Solution:** Check logs for error reason; verify API key; test with simple news

### Issue: High latency
**Solution:** Implement caching; batch multiple analyses if possible

### Issue: Rate limit errors
**Solution:** Add exponential backoff; reduce call frequency; batch requests

