from __future__ import annotations
# from numpy import empty
from pydantic import BaseModel
from typing import List, Optional


# Text Span ( for Flutter )
class TextSpan(BaseModel):
    text: str
    tag: str
    extra: Optional[str] = (None,)
    children: Optional[List[TextSpan]] = None

    @classmethod
    def _init(cls, text: str, tag: str = "", extra: str = "", children: list = []):
        return cls(text=text, tag=tag, children=children)


TextSpan.update_forward_refs()


class TextModel(BaseModel):
    original_text: str
    pattern: str = ""
    chunkList: str = ""
    text_span: TextSpan

    @classmethod
    def custom_init(
        cls,
        original_text: str,
        text_span: TextSpan,
        chunkList: str = "",
    ):
        return cls(
            original_text=original_text,
            text_span=text_span,
            chunkList=chunkList,
        )


TextSpan.update_forward_refs()
