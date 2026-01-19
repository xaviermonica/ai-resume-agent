from typing import Literal, List
from pydantic import BaseModel, Field

ExamType = Literal["midterm", "final", "viva"]
DepthType = Literal["short", "medium", "detailed"]

class InputSchema(BaseModel):
    content: str = Field(min_length=20)
    exam_type: ExamType
    depth: DepthType

class OutputSchema(BaseModel):
    title: str
    key_concepts: List[str]
    important_points: List[str]
    exam_tips: List[str]
