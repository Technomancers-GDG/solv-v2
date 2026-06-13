import os
import glob
import re

views_dir = r"c:\Users\Haris\solv-v2\frontend\src\components\views"
jsx_files = glob.glob(os.path.join(views_dir, "*.jsx"))

# Base CSS content to generate for files that don't have one
base_css = """/* NAME.css */
.dashboard-view {
  padding: 24px;
  background-color: #f8fafc;
  font-family: 'Inter', 'Roboto', sans-serif;
  color: #334155;
}

.dashboard-panel {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid #e2e8f0;
  margin-bottom: 24px;
}

.dashboard-panel-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.empty-state {
  color: #64748b;
  font-style: italic;
  font-size: 0.95rem;
}
"""

for filepath in jsx_files:
    filename = os.path.basename(filepath)
    if filename == "DashboardView.jsx":
        continue

    name = filename.replace(".jsx", "")
    css_filepath = os.path.join(views_dir, f"{name}.css")
    
    # Create the CSS file
    if not os.path.exists(css_filepath):
        with open(css_filepath, "w", encoding="utf-8") as f:
            f.write(base_css.replace("NAME", name))

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    original_content = content

    # Add import statement if missing
    import_stmt = f'import "./{name}.css";\n'
    if import_stmt not in content:
        # Find last import
        imports = list(re.finditer(r'^import .*?;$', content, flags=re.MULTILINE))
        if imports:
            last_import = imports[-1]
            content = content[:last_import.end()] + "\n" + import_stmt + content[last_import.end():]
        else:
            content = import_stmt + content

    # Replace <MetricCard with <StatsCard
    if "MetricCard" in content:
        content = content.replace("<MetricCard", "<StatsCard")
        # Ensure import is aliased or updated
        content = re.sub(r'MetricCard(?! as StatsCard)', 'MetricCard as StatsCard', content)

    # Replace <Panel title="X"> ... </Panel> with <section className="dashboard-panel"> ... </section>
    # Note: Regex replacing nested tags is very hard, we will do a simple match for the opening tag
    content = re.sub(
        r'<Panel\s+title=(["{][^"}]+["}])([^>]*)>',
        r'<section className="dashboard-panel" aria-label=\1\2>\n        <h2 className="dashboard-panel-title">{\1}</h2>',
        content
    )
    content = content.replace("</Panel>", "</section>")

    # Rename terminology
    content = content.replace("AI Decision Engine — Live", "Operations Overview")
    content = content.replace("Critical Capacity Watch", "Capacity Status")
    content = content.replace("AI reroutes considered", "Alternative routes checked")
    content = content.replace("Proactive Dispatch AI", "Proactive Dispatch Planning")

    # Change outermost <section className="view-..."> to <main className="dashboard-view">
    # We will just replace 'className="view-' with 'className="dashboard-view view-'
    content = re.sub(r'className="view-([a-zA-Z0-9_-]+)"', r'className="dashboard-view"', content)

    if content != original_content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

print("Semantic Human-Crafted refactor complete.")
