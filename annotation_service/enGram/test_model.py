import re
from spacy.lang.en import English

# from .annotation import 'test_model.py'TextModel
# from .enSpanBuilder import 'test_model.py'enSpan
# from .enChunksBuilder import 'test_model.py'enChunks

import annotation
import enSpanBuilder
import enChunksBuilder
import spacy


def runEnGramTest(text: str):
    temp: str = ""

    nlp = spacy.load("en_core_web_trf")
    texts = []
    # ------------------------------------------> Sentence segmentation
    sentencizer = English()
    sentencizer.add_pipe("sentencizer")
    text = text.replace("!", "! ").replace("?", "? ") 
    doc = sentencizer(text)
    # ------------------------------------------> Building Text Span Groups
    for sent in doc.sents:
        lang_set = nlp(sent.text)
        if len(sent) > 1:
            texts.append(
                annotation.TextModel.custom_init(
                    original_text=sent.text,
                    text_span=enSpanBuilder.enSpan(document=lang_set).get(),
                    chunkList=enChunksBuilder.enChunks(document=lang_set).get(),
                )
            )
    return texts


# Building strong relationships with colleagues can improve motivation and job satisfaction.

runEnGramTest("I've consistent with the work.")
