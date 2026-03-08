from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'dfb28695912e'
down_revision: Union[str, None] = ('70d35ebfd0eb', 'a49c912f123e')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass