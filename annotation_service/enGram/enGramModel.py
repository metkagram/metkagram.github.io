from spacy.lang.en import English
from .annotation import TextModel
from .enSpanBuilder import enSpan
from .enChunksBuilder import enChunks
import spacy
 
def runEnGram(nlp: English, text: str):
    texts = []
    # ------------------------------------------> Sentence segmentation
    sentencizer = English()
    sentencizer.add_pipe("sentencizer")
  
    if "|" in text:
        sentences = text.split("|")
    else:
        doc = sentencizer(text)
        sentences = [sent.text for sent in doc.sents]
    # ------------------------------------------> Building Text Span Groups
    for sent in sentences:
        if len(sent) > 1:
            set = nlp(sent.strip())
            texts.append(
                TextModel.custom_init(
                    original_text=sent.strip(),
                    text_span=enSpan(document=set).get(),
                    chunkList=enChunks(document=set).get(),
                )
            )
    return texts
