import networkx as nx

def build_dag_from_tasks(tasks):

    G = nx.DiGraph()
    
    for task in tasks:
        # Nodes -> Tasks
        G.add_node(task.id, title=task.title, duration=task.estimated_hours)
        
        # Edges -> Strict dependencies
        for prereq in task.prerequisites:
            G.add_edge(prereq.id, task.id)
            
    return G

def creates_cycle(tasks, task_id, prerequisite_id):
    G = build_dag_from_tasks(tasks)
    
    # Simulate adding new edge
    G.add_edge(prerequisite_id, task_id)
    
    # Check if a graph is a valid DAG
    if not nx.is_directed_acyclic_graph(G):
        return True
    
    return False

def calculate_critical_path(tasks):
    G = build_dag_from_tasks(tasks)
    
    if not G.nodes:
        return {"critical_path_ids": [], "total_hours": 0}
        
    eft = {}
    predecessors = {}

    for node in nx.topological_sort(G):
        duration = G.nodes[node].get('duration', 0)
        
        max_pred_eft = 0
        best_pred = None
        for pred in G.predecessors(node):
            if eft[pred] > max_pred_eft:
                max_pred_eft = eft[pred]
                best_pred = pred
                
        eft[node] = max_pred_eft + duration
        predecessors[node] = best_pred

    last_task = max(eft, key=eft.get)
    total_hours = eft[last_task]

    path = []
    current = last_task
    while current is not None:
        path.insert(0, current)
        current = predecessors[current]

    return {
        "critical_path_ids": path,
        "total_hours": total_hours
    }

def get_task_priorities(tasks):
    G = build_dag_from_tasks(tasks)
    cp_data = calculate_critical_path(tasks)
    critical_set = set(cp_data["critical_path_ids"])

    priorities = {}
    for node in G.nodes():
        if node in critical_set:
            priorities[node] = "Critical (Bottleneck)"
        elif G.out_degree(node) > 0: # The task is blocking at least one other task
            priorities[node] = "High (Blocker)"
        else:
            priorities[node] = "Normal"
            
    return priorities