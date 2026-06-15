# Example Integrations for Gemini Functions

## 1. Real-time Disruption Aggregation (services/simulation.py)

### Add this helper function to SimulationEngine class:

```python
def get_active_disruptions(self, session: Session) -> dict | None:
    """Fetch and analyze recent disruptions using Gemini multi-news analysis.
    
    Returns unified risk assessment or None if no recent disruptions.
    """
    from backend.utils.gemini_client import analyze_multiple_news
    
    try:
        # Fetch recent relevant news (last 4 hours of simulation time)
        cutoff_time = self.simulation_time - timedelta(hours=4)
        recent_news = session.scalars(
            select(NewsEvent)
            .where(
                (NewsEvent.relevant == True) &
                (NewsEvent.simulation_date >= cutoff_time.date())
            )
            .order_by(NewsEvent.created_at.desc())
            .limit(10)
        ).all()
        
        if not recent_news:
            return None
        
        # Combine into headlines for Gemini analysis
        headlines = [
            f"{e.city}: {e.headline} (Impact: {e.impact_type})"
            for e in recent_news
        ]
        
        disruption = analyze_multiple_news(headlines)
        
        if disruption:
            logger.info(
                f"Active disruptions detected: "
                f"event={disruption['event_type']}, "
                f"risk_score={disruption['risk_score']:.2f}, "
                f"regions={disruption['affected_regions']}"
            )
        
        return disruption
        
    except Exception as exc:
        logger.error(f"Failed to get active disruptions: {exc}")
        return None
```

### Use in dashboard_snapshot():

```python
def dashboard_snapshot(self, session: Session) -> dict:
    """... existing code ... """
    
    # Add active disruption analysis
    active_disruptions = self.get_active_disruptions(session)
    
    return {
        "vehicles": [...],
        "metrics": [...],
        "active_disruptions": active_disruptions,  # Add this
        # ... rest of snapshot
    }
```

---

## 2. Route Decision Enhancement (services/simulation.py)

### Add this method to handle route recommendations:

```python
def get_route_recommendation_with_disruption(
    self,
    vehicle: Vehicle,
    current_facility: Facility,
    destination_facility: Facility,
    session: Session
) -> dict | None:
    """Enhance route recommendation with disruption analysis.
    
    Returns enhanced recommendation dict with Gemini insights or None.
    """
    from backend.utils.gemini_client import analyze_route_impact
    
    try:
        # Get active disruptions
        disruption = self.get_active_disruptions(session)
        
        if disruption is None or disruption.get('risk_score', 0) < 0.3:
            # No significant disruptions
            return None
        
        # Format route
        route_str = f"{current_facility.city} → {destination_facility.city}"
        
        # Analyze impact on this specific route
        impact = analyze_route_impact(route_str, disruption)
        
        if impact is None:
            return None
        
        logger.info(
            f"Route impact analysis for vehicle {vehicle.identifier}: "
            f"route={route_str}, "
            f"impact={impact['impact']}, "
            f"action={impact['recommended_action']}"
        )
        
        return {
            "route": route_str,
            "impact": impact["impact"],
            "recommended_action": impact["recommended_action"],
            "reason": impact["reason"],
            "base_disruption": disruption,
        }
        
    except Exception as exc:
        logger.error(f"Route recommendation analysis failed: {exc}")
        return None
```

---

## 3. Driver Messaging Integration (main.py)

### Add this endpoint or WebSocket handler:

```python
from backend.utils.gemini_client import generate_driver_message

@app.post("/api/recommendations/{rec_id}/send-to-driver")
async def send_recommendation_to_driver(
    rec_id: int,
    session: Session = Depends(get_session)
) -> dict:
    """Send recommendation to driver with AI-generated explanation.
    
    Generates friendly driver message and sends via notification system.
    """
    rec = session.get(Recommendation, rec_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    
    try:
        # Get active disruptions for context
        disruption = simulation_engine.get_active_disruptions(session)
        
        if disruption is None:
            disruption = {
                "event_type": "route optimization",
                "affected_regions": [],
                "severity": "low"
            }
        
        # Generate driver-friendly message
        message = generate_driver_message(
            {
                "action": rec.action,
                "recommended_action": rec.action.lower().replace("_", " ")
            },
            disruption
        )
        
        # TODO: Send via your notification system
        # Examples: Firebase, push notifications, WebSocket, SMS, etc.
        logger.info(f"Driver message for {rec.vehicle_id}: {message}")
        
        return {
            "success": True,
            "message": message,
            "recommendation_id": rec_id
        }
        
    except Exception as exc:
        logger.error(f"Failed to generate driver message: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
```

---

## 4. Simulation Event Generation (services/event_ingestion.py)

### Modify import_news() to generate simulation events:

```python
def import_news(self, session: Session, full_news_import: bool = False, sample_per_sheet: int = 500) -> int:
    """Import news and generate simulation events with Gemini analysis.
    
    ... existing code ...
    """
    from backend.utils.gemini_client import generate_simulation_event
    
    path = settings.news_dataset_path
    if not path.exists():
        return 0

    self.news_model.ensure_trained()
    reader = WorkbookXmlReader(path)
    session.execute(delete(NewsEvent))
    session.commit()

    imported = 0
    source_start_year = 2020
    batch: list[NewsEvent] = []
    
    for sheet_name in reader.sheet_names():
        rows = reader.iter_sheet_rows(sheet_name)
        if not full_news_import:
            rows = rows[:sample_per_sheet]
            
        for row in rows:
            date_text = row.get("Date")
            headline = (row.get("News") or "").strip()
            if not date_text or not headline:
                continue
                
            original_date = date.fromisoformat(str(date_text))
            
            # Get Gemini prediction
            prediction = self.news_model.predict(
                str(row.get("Category") or ""), headline
            )
            
            # Generate simulation event for high-severity news
            sim_event_data = None
            if prediction.relevant and prediction.impact_score > 0.7:
                sim_event_data = generate_simulation_event(headline)
            
            # Create news event record
            news_event = NewsEvent(
                original_date=original_date,
                simulation_date=normalize_simulation_date(
                    original_date, source_start_year, settings.simulation_start_date.year
                ),
                city=str(row.get("City") or sheet_name),
                category=str(row.get("Category") or ""),
                headline=headline,
                relevant=prediction.relevant,
                impact_type=prediction.impact_type,
                impact_score=prediction.impact_score,
                model_probability=prediction.model_probability,
            )
            
            batch.append(news_event)
            
            # Optional: Log simulation event data
            if sim_event_data:
                logger.info(
                    f"Simulation event: {sim_event_data['event']} "
                    f"(severity={sim_event_data['severity']}, "
                    f"location={sim_event_data['location']}, "
                    f"duration={sim_event_data['estimated_duration_hours']}h)"
                )
            
            if len(batch) >= 500:
                session.add_all(batch)
                session.commit()
                imported += len(batch)
                batch.clear()
    
    if batch:
        session.add_all(batch)
        session.commit()
        imported += len(batch)
    
    return imported
```

---

## 5. WebSocket Real-time Updates (main.py)

### Add to WebSocket handler for live disruption alerts:

```python
@app.websocket("/ws/disruptions")
async def websocket_disruptions(websocket: WebSocket):
    """WebSocket endpoint for real-time disruption alerts.
    
    Sends updates when new disruptions detected via Gemini analysis.
    """
    await websocket.accept()
    
    try:
        while True:
            with SessionLocal() as session:
                # Get active disruptions every 30 seconds
                disruption = simulation_engine.get_active_disruptions(session)
                
                if disruption and disruption.get('risk_score', 0) > 0.5:
                    await websocket.send_json({
                        "type": "disruption_alert",
                        "data": disruption,
                        "timestamp": datetime.utcnow().isoformat()
                    })
            
            await asyncio.sleep(30)
            
    except Exception as exc:
        logger.error(f"WebSocket error: {exc}")
    finally:
        await websocket.close()
```

---

## 6. Testing These Integrations

### Quick test script:

```python
# test_gemini_integration.py

from backend.utils.gemini_client import (
    analyze_multiple_news,
    analyze_route_impact,
    generate_driver_message,
    generate_simulation_event
)

def test_integration():
    """Test complete Gemini integration flow."""
    
    # Step 1: Multi-news analysis
    news_list = [
        "Major traffic jam on Chennai ring road due to accident",
        "Logistics strike announced in Bangalore",
        "Heavy rain forecast for coastal routes"
    ]
    
    print("Step 1: Analyzing multiple news...")
    disruption = analyze_multiple_news(news_list)
    print(f"Result: {disruption}\n")
    
    if disruption is None:
        print("Multi-news analysis failed!")
        return
    
    # Step 2: Route impact analysis
    print("Step 2: Analyzing route impact...")
    impact = analyze_route_impact("Chennai → Bangalore", disruption)
    print(f"Result: {impact}\n")
    
    # Step 3: Driver message
    print("Step 3: Generating driver message...")
    if impact:
        message = generate_driver_message(impact, disruption)
        print(f"Driver Message: {message}\n")
    
    # Step 4: Simulation event
    print("Step 4: Generating simulation event...")
    event = generate_simulation_event(news_list[0])
    print(f"Result: {event}\n")
    
    print("✅ All integration tests passed!")

if __name__ == "__main__":
    test_integration()
```

Run with:
```bash
cd "c:\Users\sam\Documents\Projects\sim-pro-max\modern ui"
& ".\.venv\Scripts\python.exe" test_gemini_integration.py
```

---

## Integration Checklist

- [ ] Review `backend/utils/gemini_client.py` for all 5 new functions
- [ ] Add `get_active_disruptions()` to SimulationEngine
- [ ] Add `get_route_recommendation_with_disruption()` to SimulationEngine
- [ ] Add `/api/recommendations/{id}/send-to-driver` endpoint
- [ ] Modify `import_news()` to call `generate_simulation_event()`
- [ ] Add `/ws/disruptions` WebSocket endpoint (optional)
- [ ] Run test script to verify flow
- [ ] Enable `GEMINI_DEBUG=true` during testing
- [ ] Monitor logs for any fallbacks
- [ ] Deploy incrementally to production

