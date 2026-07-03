"""v2 enhancement - sprints, activity log, notifications, task AI fields

Revision ID: b7f8e9a0c1d2
Revises: a1b2c3d4e5f6
Create Date: 2026-07-10
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b7f8e9a0c1d2'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Create sprints table
    op.create_table('sprints',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('velocity', sa.Integer(), nullable=False, server_default='40'),
        sa.Column('status', sa.String(), nullable=True, server_default='planning'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sprints_id'), 'sprints', ['id'], unique=False)

    # 2. Add new columns to tasks
    op.add_column('tasks', sa.Column('confidence_score', sa.Float(), nullable=True))
    op.add_column('tasks', sa.Column('risk_flags', sa.Text(), nullable=True))
    op.add_column('tasks', sa.Column('ai_rationale', sa.Text(), nullable=True))
    op.add_column('tasks', sa.Column('suggested_subtasks', sa.Text(), nullable=True))
    op.add_column('tasks', sa.Column('assigned_to_id', sa.Integer(), nullable=True))
    op.add_column('tasks', sa.Column('sprint_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_tasks_assigned_to', 'tasks', 'users', ['assigned_to_id'], ['id'])
    op.create_foreign_key('fk_tasks_sprint', 'tasks', 'sprints', ['sprint_id'], ['id'])

    # 3. Create activity_log table
    op.create_table('activity_log',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('detail', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_activity_log_id'), 'activity_log', ['id'], unique=False)

    # 4. Create notifications table
    op.create_table('notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('message', sa.String(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_notifications_id'), table_name='notifications')
    op.drop_table('notifications')

    op.drop_index(op.f('ix_activity_log_id'), table_name='activity_log')
    op.drop_table('activity_log')

    op.drop_constraint('fk_tasks_sprint', 'tasks', type_='foreignkey')
    op.drop_constraint('fk_tasks_assigned_to', 'tasks', type_='foreignkey')
    op.drop_column('tasks', 'sprint_id')
    op.drop_column('tasks', 'assigned_to_id')
    op.drop_column('tasks', 'suggested_subtasks')
    op.drop_column('tasks', 'ai_rationale')
    op.drop_column('tasks', 'risk_flags')
    op.drop_column('tasks', 'confidence_score')

    op.drop_index(op.f('ix_sprints_id'), table_name='sprints')
    op.drop_table('sprints')
