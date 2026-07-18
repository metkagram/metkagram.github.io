# import spacy
from spacy.lang.de import German
from .annotation import TextModel
from .deSpanBuilder import deSpan
from .deChunksBuilder import deChunks

 
def runDeGram(nlp: German, text: str):
    texts = []
    # ------------------------------------------> Sentence segmentation
    # sentencizer = spacy.blank("de")
    sentencizer = German()
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
                    text_span=deSpan(document=set).get(),
                    chunkList=deChunks(document=set).get(),
                )
            )
    return texts