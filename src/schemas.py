from pydantic import BaseModel, Field
from typing import List, Optional


class ContentItemSchema(BaseModel):
    title: str = Field('Untitled Lesson')
    type: str = Field('lesson')
    duration: str = Field('')


class CourseCreateSchema(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="The main title of the course.")
    subtitle: Optional[str] = Field("", max_length=150, description="A brief, catchy subtitle.")
    description: str = Field(..., min_length=1, description="A detailed description of the course content.")
    level: str
    category: str
    image_url: Optional[str] = Field(None, validation_alias='image_url')
    price: float = Field(0, ge=0, description="Price of the course. 0 for free.")
    duration: Optional[str] = ""
    what_you_will_learn: List[str] = Field([], validation_alias='whatYouWillLearn')
    requirements: List[str] = []
    target_audience: List[str] = Field([], validation_alias='targetAudience')
    is_published: bool = Field(False, validation_alias='isPublished')
    is_featured: bool = Field(False, validation_alias='isFeatured')
    xp_reward: int = Field(100, ge=0, description="XP awarded for completing the course.", validation_alias='xpReward')
    content_items: List[ContentItemSchema] = Field([], validation_alias='contentItems')

    class Config:
        populate_by_name = True


class CourseUpdateSchema(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    subtitle: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = Field(None, min_length=1)
    level: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = Field(None, validation_alias='image_url')
    price: Optional[float] = Field(None, ge=0)
    duration: Optional[str] = None
    what_you_will_learn: Optional[List[str]] = Field(None, validation_alias='whatYouWillLearn')
    requirements: Optional[List[str]] = None
    target_audience: Optional[List[str]] = Field(None, validation_alias='targetAudience')
    is_published: Optional[bool] = Field(None, validation_alias='isPublished')
    is_featured: Optional[bool] = Field(None, validation_alias='isFeatured')
    xp_reward: Optional[int] = Field(None, ge=0, validation_alias='xpReward')

    class Config:
        populate_by_name = True