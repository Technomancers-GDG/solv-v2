import { useMemo, useState } from "react";
import { Input, Panel, Select } from "../common/UiPrimitives";

export function ObjectivesView({
  facilities,
  vehicles,
  objectiveForm,
  setObjectiveForm,
  handleObjectiveSubmit,
  handleObjectiveQuickUpdate,
  handleObjectiveDelete,
  updateMultiSelect,
  objectives,
  facilityLookup,
}) {
  const [expandedObjectiveId, setExpandedObjectiveId] = useState(null);
  const [editingObjectiveId, setEditingObjectiveId] = useState(null);

  const objectiveVehicleStats = useMemo(() => {
    return Object.fromEntries(
      objectives.map((objective) => {
        const assignedVehicles = vehicles.filter((vehicle) =>
          objective.assigned_vehicle_ids.includes(vehicle.id),
        );
        const activeVehicles = assignedVehicles.filter((vehicle) => vehicle.status !== "offline").length;
        return [objective.id, { total: assignedVehicles.length, active: activeVehicles }];
      }),
    );
  }, [objectives, vehicles]);

  function startEditObjective(objective) {
    setEditingObjectiveId(objective.id);
    setObjectiveForm({
      name: objective.name,
      commodity: objective.commodity,
      origin_facility_id: String(objective.origin_facility_id),
      destination_facility_id: String(objective.destination_facility_id),
      dispatch_interval_minutes: String(objective.dispatch_interval_minutes),
      loading_duration_minutes: String(objective.loading_duration_minutes),
      unloading_duration_minutes: String(objective.unloading_duration_minutes),
      sla_minutes: String(objective.sla_minutes),
      priority: String(objective.priority),
      assigned_vehicle_ids: objective.assigned_vehicle_ids.map(String),
      fallback_facility_ids: objective.fallback_facility_ids.map(String),
      active: objective.active,
    });
  }

  async function onSaveObjective() {
    const payload = {
      name: objectiveForm.name,
      commodity: objectiveForm.commodity,
      origin_facility_id: Number(objectiveForm.origin_facility_id),
      destination_facility_id: Number(objectiveForm.destination_facility_id),
      dispatch_interval_minutes: Number(objectiveForm.dispatch_interval_minutes),
      loading_duration_minutes: Number(objectiveForm.loading_duration_minutes),
      unloading_duration_minutes: Number(objectiveForm.unloading_duration_minutes),
      sla_minutes: Number(objectiveForm.sla_minutes),
      priority: Number(objectiveForm.priority),
      assigned_vehicle_ids: objectiveForm.assigned_vehicle_ids.map(Number),
      fallback_facility_ids: objectiveForm.fallback_facility_ids.map(Number),
      active: objectiveForm.active,
    };

    if (editingObjectiveId) {
      await handleObjectiveQuickUpdate(editingObjectiveId, payload);
      setEditingObjectiveId(null);
      return;
    }

    await handleObjectiveSubmit({
      preventDefault() {},
    });
  }

  async function onDeleteObjective(objective) {
    const confirmed = window.confirm(`Delete objective ${objective.name}?`);
    if (!confirmed) {
      return;
    }
    await handleObjectiveDelete(objective.id);
  }

  return (
    <section className="grid-two">
      <Panel title={editingObjectiveId ? "Edit Objective" : "Create Objective"}>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            onSaveObjective();
          }}
        >
          <Input label="Objective Name" value={objectiveForm.name} onChange={(value) => setObjectiveForm({ ...objectiveForm, name: value })} />
          <Input label="Commodity" value={objectiveForm.commodity} onChange={(value) => setObjectiveForm({ ...objectiveForm, commodity: value })} />
          <Select
            label="Origin"
            value={objectiveForm.origin_facility_id}
            options={facilities.map((facility) => [String(facility.id), `${facility.name} (${facility.city})`])}
            onChange={(value) => setObjectiveForm({ ...objectiveForm, origin_facility_id: value })}
          />
          <Select
            label="Destination"
            value={objectiveForm.destination_facility_id}
            options={facilities.map((facility) => [String(facility.id), `${facility.name} (${facility.city})`])}
            onChange={(value) => setObjectiveForm({ ...objectiveForm, destination_facility_id: value })}
          />
          <Input label="Dispatch Interval" value={objectiveForm.dispatch_interval_minutes} onChange={(value) => setObjectiveForm({ ...objectiveForm, dispatch_interval_minutes: value })} />
          <Input label="Load Minutes" value={objectiveForm.loading_duration_minutes} onChange={(value) => setObjectiveForm({ ...objectiveForm, loading_duration_minutes: value })} />
          <Input label="Unload Minutes" value={objectiveForm.unloading_duration_minutes} onChange={(value) => setObjectiveForm({ ...objectiveForm, unloading_duration_minutes: value })} />
          <Input label="SLA Minutes" value={objectiveForm.sla_minutes} onChange={(value) => setObjectiveForm({ ...objectiveForm, sla_minutes: value })} />
          <Input label="Priority" value={objectiveForm.priority} onChange={(value) => setObjectiveForm({ ...objectiveForm, priority: value })} />
          <label className="field full">
            <span>Assigned Vehicle Pool</span>
            <select multiple value={objectiveForm.assigned_vehicle_ids} onChange={(event) => updateMultiSelect(event, setObjectiveForm, "assigned_vehicle_ids")}>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.identifier} • {facilityLookup[vehicle.home_facility_id]?.city}
                </option>
              ))}
            </select>
          </label>
          <label className="field full">
            <span>Fallback Facilities</span>
            <select multiple value={objectiveForm.fallback_facility_ids} onChange={(event) => updateMultiSelect(event, setObjectiveForm, "fallback_facility_ids")}>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name} • {facility.facility_type}
                </option>
              ))}
            </select>
          </label>
          <div className="action-row field full">
            <button type="submit">{editingObjectiveId ? "Save Objective" : "Create Objective"}</button>
            {editingObjectiveId ? (
              <button type="button" className="small" onClick={() => setEditingObjectiveId(null)}>
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </Panel>

      <Panel title="Objectives Management">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Commodity</th>
                <th>Origin → Destination</th>
                <th>Dispatch Interval</th>
                <th>SLA</th>
                <th>Priority</th>
                <th>Assigned Vehicles</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {objectives.map((objective) => {
                const isExpanded = expandedObjectiveId === objective.id;
                const stats = objectiveVehicleStats[objective.id] ?? { total: 0, active: 0 };

                return (
                  <>
                    <tr key={objective.id}>
                      <td>{objective.name}</td>
                      <td>{objective.commodity}</td>
                      <td>
                        {facilityLookup[objective.origin_facility_id]?.name} →{" "}
                        {facilityLookup[objective.destination_facility_id]?.name}
                      </td>
                      <td>{objective.dispatch_interval_minutes} min</td>
                      <td>{objective.sla_minutes} min</td>
                      <td>
                        <span className="priority">P{objective.priority}</span>
                      </td>
                      <td>
                        {stats.active}/{stats.total}
                      </td>
                      <td>{objective.active ? "active" : "inactive"}</td>
                      <td className="table-actions">
                        <button type="button" className="small" onClick={() => setExpandedObjectiveId(isExpanded ? null : objective.id)}>
                          {isExpanded ? "Hide" : "Details"}
                        </button>
                        <button type="button" className="small" onClick={() => startEditObjective(objective)}>
                          Edit
                        </button>
                        <button type="button" className="small danger" onClick={() => onDeleteObjective(objective)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                    {isExpanded ? (
                      <tr key={`${objective.id}-details`}>
                        <td colSpan={9}>
                          <div className="lane-card">
                            <div className="lane-meta">
                              <span>Loading: {objective.loading_duration_minutes} min</span>
                              <span>Unloading: {objective.unloading_duration_minutes} min</span>
                              <span>Fallback Nodes: {objective.fallback_facility_ids.length}</span>
                            </div>
                            <div className="chip-row">
                              {objective.assigned_vehicle_ids.map((vehicleId) => (
                                <span className="chip" key={vehicleId}>
                                  {vehicles.find((vehicle) => vehicle.id === vehicleId)?.identifier ?? `Vehicle ${vehicleId}`}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  );
}
