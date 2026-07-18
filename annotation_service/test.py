from __future__ import annotations, print_function, unicode_literals
from numpy import empty
import spacy
from spacy import displacy


# from textstat.textstat import textstat
from deGram.deChunksBuilder import deChunks

nlp = spacy.load("de_dep_news_trf")

# doc = nlp("Ich schatze sehr, dass du mire geholfen hast.")
doc = nlp("Die Tür ist geschlossen.")
displacy.serve(doc, style="dep", auto_select_port=True)
# for token in doc:
#     pass
# if token.pos_ == "AUX" and token.lemma_ == "werden":
#     print(token.text)
#     print([child.text for child in token.children])

# print(
#     token.text,
#     token.i,
#     token.pos_,
#     token.tag_,
#     token.dep_,
#     # token.head,
#     token.head.morph,
#     # token.morph,
#     # token.head,
#     [child.text for child in token.head.children],
#     [child.text for child in token.children],
# )


test = deChunks(doc).get()
