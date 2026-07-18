import re
from spacy.lang.de import German
 

import annotation
import deSpanBuilder
import deChunksBuilder
import spacy


def runEnGramTest(text: str):
    temp: str = ""
    # de_dep_news_trf 
    nlp = spacy.load("de_dep_news_trf")
    texts = []
    # ------------------------------------------> Sentence segmentation
    sentencizer = German()
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
                    text_span=deSpanBuilder.deSpan(document=lang_set).get(),
                    chunkList=deChunksBuilder.deChunks(document=lang_set).get(),
                )
            )
    return texts


# Wie viele Kunden haben an der Umfrage teilgenommen?
# Ich war so nervos, dass ich meine Notizen vergessen habe.
# Hast du den Buch gelesen oder den Film geschaut? 
# Hast du das Buch gelesen?
# Ich habe eine Idee fur unsere Strategie, die ich genre mit dir besprechen wurde.
# Hast du bemerkt, dass er Fehler macht.
# Immer wenn ich nervos bin, kaue ich an.
# Der Berg war steil, dass er kaum hochklettern konnte. 
#  habe eine Idee für ein Project, das ich gerne mit dir teilen würde.
# Das Haus, ein altes Gebaude, wurde renoviert.
# Das Wichtigste ist, dass sie glücklich ist.
runEnGramTest("Warum bist du nicht zum Meeting gegangen?")
# "Er ist so mude, dass er sofort eingeszurehlafen ist."
# "Der Film ist so spannend, dass ich ihn zweimal gesehen habe."
# "Nicht nur sie ist klug, sondern auch er ist sehr intelligent."
# "Während ich koche, höre ich gern."
# "Ich schatze sehr, dass du mire geholfen hast."
# "Unsere oberste Pioritat ist, dass alle informiert sind."
# "Sie hat über 100 Bücher gelesen."
# "Sie besuchte die Schule, deren Gebaude renovier wurde."
#/ "Weißt du, für wen diese Informationen wichtig sind?"
# "Was für Pflanzen wachsen in deinem Garten?"
# "Welches Auto ist schneller, das roter oder das blaue?"