from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '59cdaeb21bd1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Clear tasks and dependencies if they exist so we can add non-nullable project_id
    op.execute("DELETE FROM task_dependencies")
    op.execute("DELETE FROM tasks")

    # 2. Create projects table
    op.create_table('projects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_projects_id'), 'projects', ['id'], unique=False)
    op.create_index(op.f('ix_projects_name'), 'projects', ['name'], unique=False)

    # 3. Create project_access table
    op.create_table('project_access',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_project_access_id'), 'project_access', ['id'], unique=False)

    # 4. Add project_id to tasks
    op.add_column('tasks', sa.Column('project_id', sa.Integer(), nullable=False))
    op.create_foreign_key(None, 'tasks', 'projects', ['project_id'], ['id'])


def downgrade() -> None:
    # Drop project_id from tasks
    op.drop_constraint(None, 'tasks', type_='foreignkey')
    op.drop_column('tasks', 'project_id')

    # Drop tables
    op.drop_index(op.f('ix_project_access_id'), table_name='project_access')
    op.drop_table('project_access')
    op.drop_index(op.f('ix_projects_name'), table_name='projects')
    op.drop_index(op.f('ix_projects_id'), table_name='projects')
    op.drop_table('projects')
