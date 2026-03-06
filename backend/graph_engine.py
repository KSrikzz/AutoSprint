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