# schemas.py - FIXED VERSION

from typing import List, Optional
from pydantic import BaseModel, Field

class ContentItemSchema(BaseModel):
    title: str = Field('Untitled Lesson')
    type: str = Field('lesson')
    duration: str = Field('')


class CourseCreateSchema(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="The main title of the course.")
    subtitle: Optional[str] = Field("", max_length=150, description="A brief, catchy subtitle.")
    description: str = Field(..., min_length=1, description="A detailed description of the course content.")
    level: str = Field(..., description="Course level (Beginner, Intermediate, Advanced)")
    category: str = Field(..., description="Course category")
    image_url: Optional[str] = Field(None, alias='imageUrl', description="URL or path to the course image")
    price: float = Field(0, ge=0, description="Price of the course. 0 for free.")
    duration: Optional[str] = Field("", description="Estimated course duration")
    what_you_will_learn: List[str] = Field([], alias='whatYouWillLearn', description="List of learning outcomes")
    requirements: List[str] = Field([], description="List of prerequisites")
    target_audience: List[str] = Field([], alias='targetAudience', description="Target audience for the course")
    is_published: bool = Field(False, alias='isPublished', description="Whether the course is published")
    is_featured: bool = Field(False, alias='isFeatured', description="Whether the course is featured")
    xp_reward: int = Field(100, alias='xpReward', ge=0, description="XP awarded for completing the course")
    content_items: List[ContentItemSchema] = Field([], alias='contentItems', description="Initial content items")
    modules: Optional[List[dict]] = Field(None, description="Course modules with lessons")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "title": "Web Development Bootcamp",
                "subtitle": "Learn Full-Stack Web Development",
                "description": "Complete web development course with HTML, CSS, JavaScript, React, and Node.js.",
                "level": "Beginner",
                "category": "Development",
                "price": 49.99,
                "duration": "40 hours",
                "what_you_will_learn": ["Build responsive websites", "Create web applications", "Work with databases"],
                "requirements": ["Basic computer knowledge"],
                "target_audience": ["Beginners", "Career changers"],
                "xp_reward": 100
            }
        }


class CourseUpdateSchema(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    subtitle: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = Field(None, min_length=1)
    level: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = Field(None, alias='imageUrl')
    price: Optional[float] = Field(None, ge=0)
    duration: Optional[str] = None
    what_you_will_learn: Optional[List[str]] = Field(None, alias='whatYouWillLearn')
    requirements: Optional[List[str]] = Field(None)
    target_audience: Optional[List[str]] = Field(None, alias='targetAudience')
    is_published: Optional[bool] = Field(None, alias='isPublished')
    is_featured: Optional[bool] = Field(None, alias='isFeatured')
    xp_reward: Optional[int] = Field(None, alias='xpReward', ge=0)
    modules: Optional[List[dict]] = Field(None)

    class Config:
        populate_by_name = True


# Add other schemas if needed
class UserRegisterSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: str = Field(..., pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    password: str = Field(..., min_length=6)
    role: str = Field('user', pattern=r'^(admin|instructor|user)$')


class UserLoginSchema(BaseModel):
    email: str = Field(..., pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    password: str = Field(..., min_length=6)


class QuizAnswerSchema(BaseModel):
    question_id: int
    option_id: int


class QuizSubmitSchema(BaseModel):
    answers: dict  # question_id: option_id