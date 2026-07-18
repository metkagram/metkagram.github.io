from __future__ import annotations, print_function, unicode_literals

import spacy
from numpy import empty
from pydantic import BaseModel
from typing import List, Optional

prepositions = {    'an', 'auf', 'hinter', 'in', 'neben', 'über', 'unter', 'vor', 'zwischen',  # Wechselpräpositionen
                    'aus', 'außer', 'bei', 'mit', 'nach', 'seit', 'von', 'zu',    "ausser" ,   "gegenüber" ,               # Dativpräpositionen
                    'bis', 'durch', 'für', 'gegen', 'ohne', 'um',          # Akkusativpräpositionen
                    'anstatt', 'statt', 'trotz', 'während', 'wegen',                         # Genitivpräpositionen
                    'am', 'im', 'ans', 'ins', 'zum', 'zur', 'vom'
                    'außerhalb',  'innerhalb', 'diesseits', 'oberhalb',
                    }
temporal_expressions = [
    # Days (Tag)
    "jeden Tag", "letzten Tag", "diesen Tag", "nächsten Tag", "einen Tag",
    "jeden Montag", "jeden Dienstag", "jeden Mittwoch", "jeden Donnerstag", 
    "jeden Freitag", "jeden Samstag", "jeden Sonntag",
    
    # Weeks (Woche)
    "jede Woche", "letzte Woche", "diese Woche", "nächste Woche", "eine Woche",
    
    # Months (Monat)
    "jeden Monat", "letzten Monat", "diesen Monat", "nächsten Monat", "einen Monat",
    
    # Years (Jahr)
    "jedes Jahr", "letztes Jahr", "dieses Jahr", "nächstes Jahr", "ein Jahr",
    
    # Seasons (Jahreszeit)
    "jeden Frühling", "letzten Frühling", "diesen Frühling", "nächsten Frühling",
    "jeden Sommer", "letzten Sommer", "diesen Sommer", "nächsten Sommer",
    "jeden Herbst", "letzten Herbst", "diesen Herbst", "nächsten Herbst",
    "jeden Winter", "letzten Winter", "diesen Winter", "nächsten Winter",
    
    # Holidays (Feiertage)
    "jeden Weihnachten", "letzten Weihnachten", "dieses Weihnachten", "nächstes Weihnachten",
    "jedes Ostern", "letztes Ostern", "dieses Ostern", "nächstes Ostern"
]

accusative_prepositions = {'um', 'für', 'gegen', 'ohne', 'durch', 'dürch' , 'über', 'bis'}
accusative_tags = {'APPR', 'ART', 'PDAT', 'PDS', 'ADJA', 'PIS', 'PIAT', 'PIDAT', 'PPOSAT', 'APPRART'}
personal_pronouns = {'mich', 'dich', 'sich', 'euch', 'uns'}
reflexive_pronouns = {'mir', 'dir', 'sich', 'euch', 'uns'}


class AdjectiveSplitter:
    @staticmethod
    def getMorphology(token, feature):
        # Dummy implementation, replace with actual logic
        return token.morph.get(feature)
    @staticmethod
    def determineBaseAndEnding(adj, number, case, gender):
        # Extract the first element safely from each list
        number = number[0] if number and isinstance(number, list) and len(number) > 0 else None
        gender = gender[0] if gender and isinstance(gender, list) and len(gender) > 0 else None
        case = case[0] if case and isinstance(case, list) and len(case) > 0 else None

        # Handle cases for endings
        if number == "Plur":
            if adj.endswith("en"):
                return adj[:-2], "en"
            elif adj.endswith("e"):
                return adj[:-1], "e"
        elif number == "Sing":
            if gender == "Masc":
                if case in ["Nom"]:
                    return adj[:-2], "er" if adj.endswith("er") else (adj[:-1], "e" if adj.endswith("e") else (adj, ""))
                elif case in ["Acc"]:
                    if adj.endswith("en"):
                        return adj[:-2], "en"
            elif gender == "Neut" and case in ["Nom", "Acc"]:
                if adj.endswith("es"):
                    return adj[:-2], "es"
                elif adj.endswith("e"):
                    return adj[:-1], "e"
            elif gender == "Fem" and case in ["Nom", "Acc"]:
                if adj.endswith("e"):
                    return adj[:-1], "e"
            elif case in ["Dat", "Gen"]:
                if adj.endswith("en"):
                    return adj[:-2], "en"
        return adj, ""    
    # Default case
       #  return adj, ""
    # @staticmethod
    # def determineBaseAndEnding(adj, number, case, gender):
    #     # Extract the first element safely from each list
    #     number = number[0] if number and isinstance(number, list) and len(number) > 0 else None
    #     gender = gender[0] if gender and isinstance(gender, list) and len(gender) > 0 else None
    #     case = case[0] if case and isinstance(case, list) and len(case) > 0 else None

    #     # Handling irregular or exception cases
    #     if adj.endswith("e") and not (adj.endswith("en") or adj.endswith("er") or adj.endswith("es")):
    #         return adj[:-1], "e"

    #     if number == "Plur":
    #         if adj.endswith("en"):
    #             return adj[:-2], "en"
    #     elif number == "Sing":
    #         if gender == "Masc" and case in ["Nom", "Acc"]:
    #             return adj[:-2], "er" if adj.endswith("er") else (adj[:-1], "e" if adj.endswith("e") else (adj, ""))
    #         elif gender == "Neut" and case in ["Nom", "Acc"]:
    #             return adj[:-2], "es" if adj.endswith("es") else (adj[:-1], "e" if adj.endswith("e") else (adj, ""))
    #         elif gender == "Fem" and case in ["Nom", "Acc"]:
    #             return adj[:-1], "e"

    #     # Default case
    #     return adj, ""


    @staticmethod
    def splitAdj(token):
        token_number = AdjectiveSplitter.getMorphology(token, "Number")
        token_case = AdjectiveSplitter.getMorphology(token, "Case")
        token_gender = AdjectiveSplitter.getMorphology(token, "Gender")
        
        string_adj = token.text
        print(token.text)
        base, ending = AdjectiveSplitter.determineBaseAndEnding(string_adj, token_number, token_case, token_gender)
        print(f"Base: {base}, Ending: {ending}")
        # Assuming TextSpan and DeGramHelper are defined elsewhere
        ending = ending if isinstance(ending, str) else ""
        return [
            TextSpan._init(base, token.tag_),
            TextSpan._init(ending + " ", DeGramHelper.getFunction(token=token, ending=True))
        ]


# Text Span ( for Flutter )
class TextSpan(BaseModel):
    text: str
    tag: str
    children: Optional[List[TextSpan]] = None
    extra: Optional[str] = None

    @classmethod
    def _init(cls, text: str, tag: str = "", extra: str = "", children: list = []):
        return cls(text=text, tag=tag, extra=extra, children=children)


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


class SpanGroupSet:
    textSpan: TextSpan = None

    def addChild(self, textSpan: TextSpan):
        if self.textSpan != None:
            self.textSpan.children.append(textSpan)

    def get(self):
        return self.textSpan

class Word(SpanGroupSet):
    def markConj(self):
        text = self.token.text_with_ws if self.token.text_with_ws else self.token.text
        revert_order = TextSpan._init(text="←...", tag="tag")
        self.textSpan = TextSpan._init(text=" ", tag="Conj")

        # Um zu, ohne zu - Prapositionen in VPs
        if  (self.token.dep_ == "cp" and self.token.tag_ == "KOUS") or (self.token.tag_ == "PWAV" and self.token.i != 0) :
            self.add_conj_child(revert_order, text, self.token.tag_)

        # Ohne daß, statt daß. . .
        elif self.token.dep_ == "ac": self.add_conj_child(revert_order, text, self.token.tag_)

        # [der Hund ,] der
        elif self.token.dep_ == "sb" and self.token.tag_ == "PRELS":
            prels = self.getMorphology(self.token, "Case")
            case_tag = self.getCaseTag(prels)
            self.add_conj_child(revert_order, text, self.token.tag_, case_tag)

        elif self.token.dep_ == "sb" and self.prevToken and self.prevToken.tag_ == "PRELAT":
            self.add_conj_child(revert_order, text, self.token.tag_)

    def add_conj_child(self, revert_order, text, tag, additional_tag=None):
        self.addChild(revert_order)
        self.addChild(TextSpan._init(" ", tag="X1"))
        if additional_tag: self.addChild(TextSpan._init(additional_tag, tag="tag"))
        self.addChild(TextSpan._init(text, "HL"))
        

    def splitAdj(self):
        token_number = self.getMorphology(self.token, "Number")
        token_case = self.getMorphology(self.token, "Case")
        token_gender = self.getMorphology(self.token, "Gender")
        
        string_adj = self.token.text
        string_adj_end = string_adj[-1:] if string_adj.endswith('e') else string_adj[-2:]

        if self.token.lemma_ != string_adj.lower() and string_adj.__contains__(self.token.lemma_) and token_number == "Sing":
            lemma_length = len(self.token.lemma_)
            self.textSpan = TextSpan._init(text="", tag="Adj-Split")
            self.addChild(TextSpan._init(self.token.lemma_, self.token.tag_))
            self.addChild(TextSpan._init(self.token.text_with_ws[lemma_length:], DeGramHelper.getFunction(token=self.token, ending=True)))
        elif token_number == "Sing" and token_case and self.token.pos_ == "ADJ":
            text_split_index = -2 if string_adj_end in ("es", "en", "em", "er") or (string_adj_end == "e" and token_gender == "Fem") else -3
            self.textSpan = TextSpan._init(text="", tag="Adj-Split")
            self.addChild(TextSpan._init(self.token.text[:text_split_index], self.token.tag_))
            self.addChild(TextSpan._init(string_adj[-text_split_index+1:] + " ", DeGramHelper.getFunction(token=self.token, ending=True)))
        elif token_number == "Plur" and token_case and self.token.pos_ == "ADJ":
            text_split_index = -2 if string_adj_end in ("en", "er" ,"de") else -3
            self.textSpan = TextSpan._init(text="", tag="Adj-Split")
            self.addChild(TextSpan._init(self.token.text_with_ws[:text_split_index], self.token.tag_))
            self.addChild(TextSpan._init(string_adj[-text_split_index:] + " ", DeGramHelper.getFunction(token=self.token, ending=True)))
        else:
            self.textSpan = TextSpan._init(text=self.token.text_with_ws, tag=DeGramHelper.getFunction(self.token))
            
    def getMorphology(self, token: spacy.tokens.doc.Token, aspect: str):
        return token.morph.to_dict().get(aspect, "")


    def get_next_token(self):
        if self.token.i + 1 < len(self.doc): return self.doc[self.token.i + 1]
        return None

    # Constructor
    def __init__(
        self,
        token: spacy.tokens.doc.Token,
        isTagged: bool = True 
    ):
 
        self.func_dict = {
            "aux": self.deVerbAuxilary,
            "nk": self.addOtherSpan,
            #  eine selbstbewusste, berufstätige Frau.
            "cj": self.addOtherSpan,
            "acl": self.deVerbPart,
            "svp" : self.getPredicate,  
            "pd" : self.getPredicate,  
            "op" : self.getPredicate,
            "cc" : self.getPredicate,
        }

        self.pos_func_dict = { "VERB": self.deVerbPart, "AUX": self.deVerbModal }

        self.token = token
        self.isTagged = isTagged
        
        if ( token.dep_ in (  'cj', 'cc') and token.pos_ == 'AUX'):
            self.deVerbModal()
            if ( token.dep_ in (  'cj', 'cc') ):
                return

        # Call the appropriate function based on the token's dependency
        if token.dep_ in self.func_dict: self.func_dict[token.dep_]()
            
            
        # Join & Pronoun & Relative clause
        elif (
            (token.i > 1 and (
                token.pos_ == "SCONJ" or
                (token.pos_ == "PRON" and self.token.tag_ in ("PRELS", "PWS"))
            )) or
            (token.tag_ == 'KOUS' and token.i == 0)
        ) and token.tag_ != "KOUI":
            self.markConj()
            
        # Partizip Perfekt, voll  & Partizip Perfekt, modal & Partizip Perfekt, aux  
        elif token.tag_ == 'VVPP' or token.tag_ == 'VAPP' or token.tag_ == 'VMPP' :
            self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
            self.addChild(TextSpan._init("v2", "tag"))
            self.addChild(
                        TextSpan._init(self.token.text_with_ws, self.token.dep_) )   
            
        elif token.tag_ == 'VAFIN' and token.pos_ == "AUX"  and token.lemma_ == 'sein':
            self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
            self.addChild(TextSpan._init("st", "tag"))
            self.addChild(
                        TextSpan._init(self.token.text_with_ws, self.token.dep_) ) 
            
            
        # Imperativ, voll    
 
        elif ( token.tag_ == 'VVIMP' and token.lemma_ == 'wirst' )  :
            self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
            self.addChild(TextSpan._init("Hf", "tag"))
            self.addChild(
                        TextSpan._init(self.token.text_with_ws, self.token.dep_) )   
    
        # Call the appropriate function based on the token's pos_
        elif token.pos_ in self.pos_func_dict:
            if token.pos_ == "AUX" :
                self.deVerbModal()
            elif token.pos_ in ("AUX", "VERB") and token.text == "m":
                self.textSpan = TextSpan._init(text=token.text_with_ws, tag="Verb-Mark")
            else:
                self.pos_func_dict[token.pos_]()

        else:
            # Bug fix 22.09.23 They quit smoking for better health.
            has_dt_child = any(child.dep_ == 'det' for child in token.children)
            if (
                self.token.dep_ in ("xcomp", "dobj")
                and self.token.tag_ == "NN"
                and "ing" in self.token.text
            ) and ( self.token.dep_  == "dobj"  and has_dt_child == False):
                self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
                self.addChild(TextSpan._init("pA", "tag"))
                self.addChild(TextSpan._init(self.token.text_with_ws, self.token.dep_))
            else:
                # Addition negation to the words
                extra: str = ""
                if "kein" in token.text_with_ws  and token.dep_ ==  'nk':
                    extra = 'Neg'
                    
                if extra == '':
                    extra = DeGramHelper.getFunction(token=token, ending=True)
                if ( self.token.tag_ == 'VVFIN'):
                    self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
                    self.addChild(TextSpan._init("V", "tag"))
                    self.addChild(TextSpan._init(self.token.text_with_ws, self.token.dep_,  self.getMorphology(self.token, "Tense")) )   
                if ( self.token.tag_ == 'NN'):
                   self.textSpan = TextSpan._init(
                    text=token.text_with_ws, tag=DeGramHelper.getFunction(token=token, ending=True)
                  )     
                else:    
                    self.textSpan = TextSpan._init(
                        text=token.text_with_ws, tag=self.token.dep_ , extra=  extra 
                    )
                
                
                

    def addOtherSpan(self):
        if self.token.pos_ == 'ADJ': 
            self.textSpan = TextSpan._init(text=" ", tag="Adj-Mark")
            children = AdjectiveSplitter.splitAdj(self.token)
            for child in children:
                self.addChild(TextSpan._init(child.text, child.tag  ))
        elif self.token.pos_ == 'VERB' and ( self.token.tag_ in ( 'VVIMP', 'VVFIN',  'VAFIN' )    ):
            self.textSpan = TextSpan._init(text=" ", tag="Verb-Mark")
            self.addChild(TextSpan._init("V", "tag", self.getMorphology(self.token, "Tense")))
            self.addChild(TextSpan._init(self.token.text_with_ws, self.token.dep_))
        elif self.token.pos_ == 'VERB'  and   self.token.tag_ in (  'VVINF', "VVPP" )  and self.token.dep_ == 'cj'  :
            self.textSpan = TextSpan._init(text=" ", tag="Verb-Mark")
            self.addChild(TextSpan._init("v2", "tag", self.getMorphology(self.token, "Tense")))
            self.addChild(TextSpan._init(self.token.text_with_ws, self.token.dep_))
        elif self.token.pos_ == 'VERB'  and   self.token.tag_ in ( 'VVIZU' )  and self.token.dep_ == 'cj'  :
            self.textSpan = TextSpan._init(text=" ", tag="Verb-Mark")
 
            self.addChild(TextSpan._init(self.token.text_with_ws, self.token.dep_))
        elif self.token.pos_ == 'AUX':
            self.textSpan = TextSpan._init(text=" ", tag="Verb-Mark")
            self.addChild(TextSpan._init(self.token.text_with_ws, self.token.dep_))
        elif self.token.pos_ == 'VERB' and self.token.tag_ == 'VMFIN':
            self.textSpan = TextSpan._init(text=" ", tag="Verb-Mark")
            self.addChild(TextSpan._init("M", "tag", self.getMorphology(self.token, "Tense")))
            self.addChild(TextSpan._init(self.token.text_with_ws, self.token.dep_))
        else:
            function_tag = DeGramHelper.getFunction(token=self.token, ending=True)
            self.textSpan = TextSpan._init(text=self.token.text_with_ws, tag=function_tag, extra=function_tag)
        

    def deVerbAuxilary(self):
        tense = self.getMorphology(self.token, "Tense")
        if self.token.tag_ == "VMFIN"  : tag = "VMFIN"
        self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
        self.addChild(TextSpan._init(tag, "tag", extra=tense))
        self.addChild(TextSpan._init(self.token.text_with_ws, self.token.dep_))


   
    def getPredicate(self):
        token_tag = self.token.tag_
        token_pos = self.token.pos_
        token_dep = self.token.dep_
        token_text_with_ws = self.token.text_with_ws

        if token_dep == "pd":
            if token_tag == "NN":
                self.textSpan = TextSpan._init(token_text_with_ws, DeGramHelper.getFunction(token=self.token))
            elif token_pos == "VERB":
                self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
                self.addChild(TextSpan._init("v2", "tag"))
                self.addChild(TextSpan._init(token_text_with_ws, token_dep))
            elif token_tag not in ["ADJD", "VVPP"]:
                self.textSpan = TextSpan._init(token_text_with_ws, token_dep)
            else:
                self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
                self.addChild(TextSpan._init("v2", "tag"))
                self.addChild(TextSpan._init(token_text_with_ws, token_dep))
        elif token_dep == "cc":
            self.textSpan = TextSpan._init(token_text_with_ws, DeGramHelper.getFunction(token=self.token, ending=True))
        else:
            self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
            self.addChild(TextSpan._init("v2", "tag"))
            self.addChild(TextSpan._init(token_text_with_ws, token_dep))
 
 
    def deVerbModal(self):
        lemma_lower = self.token.lemma_.lower()   
        token_tag = self.token.tag_
        token_head_pos = self.token.head.pos_

        tense = self.getMorphology(self.token, "Tense")
        isPassive = DeGramHelper.isVerbInPassive(self.token)

        tag = ""
        if lemma_lower in ["werden", "würde",  'wirst'] and not isPassive:
            tag = "v2" if token_tag == 'VAINF' and token_head_pos == 'AUX' else "Hf"
        elif lemma_lower in ["sein", "bist", 'seid', 'ist', 'sind', 'seien', 'sei',  "werden"] and (lemma_lower != "werden" or isPassive):
            tag = "H" if isPassive else "st"
        elif lemma_lower in ['müssen', "können", "dürfen", "mögen", "müssen",  "sollen", "wollen"] :
             tag = "M"
        elif token_tag == "VMFIN":
            tag = "Hf" if lemma_lower == "werden" else "M"
        elif lemma_lower in ["got", "get", "did", "do"]:
            tag = "H"
        elif lemma_lower in ["haben", "hasben", "habe", "hab", "habt"] and ( DeGramHelper.isVerbInResult(token=self.token) or DeGramHelper.isVerbInResult2(token=self.token)):
            tag = "Hr"
        else:
            tag = 'V'

        self.textSpan = TextSpan._init(text=" ", tag="Verb-Mark")
        self.addChild(TextSpan._init(tag, "tag", tense))
        self.addChild(TextSpan._init(self.token.text_with_ws, self.token.dep_))
 

    def deVerbPart(self):
        tense = self.getMorphology(self.token, "Tense")
        verbForm = self.getMorphology(self.token, "VerbForm")
        special_lemmas = ["lassen", "lässt", "lass", "kann", "muss", "müss", "darf", "dürf", "woll", 
                          'können', 'wollen', "dürfen", "mögen", "sollen",  "wollen", "müssen"   ]
    
        if self.token.lemma_.lower() in special_lemmas or any(self.token.lemma_.lower().startswith(prefix) for prefix in ["kann", "muss", "müss", "darf", "dürf", "woll"]): 
            self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
            self.addChild(TextSpan._init("M", "tag", extra=tense))
            self.addChild(TextSpan._init(self.token.text_with_ws, self.token.tag_))
            return

        tag = "V"
        
        if ( self.token.i == 0 and self.token.lemma_.lower().startswith("ha") and DeGramHelper.isVerbInResult(token=self.token)):
            tag = 'Hr'
        else:
            if verbForm == "Fin":  tag = "M" if self.token.lemma_.lower() in ["willen", "wollen"] else "V"
            elif verbForm == "Inf":  tag = "v2"
            
        self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
        self.addChild(TextSpan._init(tag, "tag", extra=tense))
        self.addChild(TextSpan._init(self.token.text_with_ws, self.token.tag_))
 

  
class DeGramHelper:
    
    @staticmethod
    def hasChildNKWithCase(token, case):
        for child in token.children:
            if child.dep_ == 'nk':
                nk_case = child.morph.to_dict().get('Case')
                if nk_case == case:
                    return True
        if ( token.dep_ == 'nk' )   :     
            nk_case = token.morph.to_dict().get('Case')
            if nk_case == case:
                return True         
        
        return False
    
    def hasVerbImerativ(token ):
        for child in token.children:
            if child.dep_ == 'oc':
                if child.pos_ == 'VERB':
                    return True
        return False
    

    @staticmethod
    def isVerbInPassive(token: spacy.tokens.doc.Token):
        return token.pos_ == "AUX" and token.lemma_ == "werden" and any(child.tag_ == "VVPP" for child in token.head.children)
    
    def isVerbInResult(token: spacy.tokens.doc.Token):
        return token.pos_ in ( "VERB", 'AUX' )   and any(child.tag_ == "VVPP" for child in token.head.children)

    def isVerbInResult2(token: spacy.tokens.doc.Token):
        return token.pos_ in ( "VERB", 'AUX' ) and any(child.tag_ == "VVPP" for child in token.children)
    
    @staticmethod
    def isPassiv(token: spacy.tokens.doc.Token):
        if token.tag_ == "APPR": return False

        if token.dep_ == "sb" and token.head is not None and token.head.lemma_ != "haben":
            return token.head.lemma_ == "werden" and any(child.tag_ == "VVPP" for child in token.head.children)

        return any(
            child.dep_ == "sb" and child.head is not None and child.head.pos_ == "AUX"
            and any(sub_child.lemma_ == "werden" and any(sub_sub_child.tag_ == "VVPP" for sub_sub_child in sub_child.children)
                    for sub_child in child.children)
            for child in token.children
        )
    
    @staticmethod
    def isPassivModal(token: spacy.tokens.doc.Token):
        if token.tag_ == "APPR": 
            return False

        if token.dep_ == "sb" and token.head is not None and  token.head.lemma_ != 'haben'  and  ( token.head.pos_ != 'VERB'):
            # Check for an 'oc' dependency among the children of the head token
            for child in token.head.children:
                if child.dep_ == "oc":
                    # Check if this child has its own child with the tag 'VVPP'
                    if any(grandchild.tag_ == "VVPP" for grandchild in child.children):
                        return True

            # Alternatively, check for a child with the tag 'VVPP' directly under the head
            vvpp_exists = any(child.tag_ == "VVPP" for child in token.head.children) and token.head.lemma_ == 'werden'
            return vvpp_exists

        return False

 
    @staticmethod
    def getMorphology(token: spacy.tokens.doc.Token, aspect: str):
        return token.morph.to_dict().get(aspect)

    @staticmethod
    def getFunction(token: spacy.tokens.doc.Token, ending: bool = False):
        if token.dep_ in ['oa', 'sb', 'nk', 'pd', 'cj'] or token.tag_ == 'NN':
            if token.pos_ in ["NOUN", "PRON"] or (token.pos_ == "DET" and DeGramHelper.getMorphology(token, "Number") == "Sing") or ending:
                gender = DeGramHelper.getMorphology(token, "Gender")
                return {"Fem": "FEM", "Masc": "MASC", "Neut": "NEUT"}.get(gender, "")

        return ""


class deSpan:
    nextTokenID: int = 0

    def getFunction(self, token: spacy.tokens.doc.Token, ending: bool = False):
        tag: str = ""
        gender = self.getMorphology(token, "Gender")
        number = self.getMorphology(token, "Number")
        
        if token.dep_ in ['oa', 'sb', 'nk']:
  
            # Gender function
            if (
                token.pos_ == "NOUN"
                or (token.pos_ == "DET" and number == "Sing")
                or token.pos_ == "PRON"
                or ending
            ):
 
                if tag == None or tag == "":
                    if token.tag_ == "PWAT":
                        match gender:
                            case "Fem":
                                return "Q/FEM"
                            case "Masc":
                                return "Q/MASC"
                            case "Neut":
                                return "Q/NEUT"
                    else:
                        match gender:
                            case "Fem":
                                return "FEM"
                            case "Masc":
                                return "MASC"
                            case "Neut":
                                return "NEUT"
        return tag
                     
    def __init__(self, document: spacy.tokens.doc.Doc):
        self.document = document
        self.textSpan = TextSpan._init(text="", tag="Sentence")

        # List of methods to process each token
        self.token_methods = [
            self.buildSkip,
            self.buildPunct,
            self.buildUsual, 
            self.buildParticle,
            self.buildParticle2Adv,
            self.buildQuestIntro,
            self.buildComplexCoord,  
            self.buildSubject,   
            self.buildAkkusativ,
            self.buildGenetiv,
            self.buildDativ,
            self.buildOther,
        ]

        self.process_tokens()

 
    def process_tokens(self):
        for token in self.document:
            if self.isNext(token.i):
                for method in self.token_methods:
                    if self.isNext(token.i):
                        method(token)
                        
                        
                        
    def _shouldBreakInLoop(self, current_token, previous_token, fix_dat):
        # Implement the logic to decide if loop should break
        if current_token.dep_ in ("punct", "aux") and current_token.text != "-":
            return True
        if current_token.dep_ == 'ng'   :
            return True
        if DeGramHelper.hasChildNKWithCase(current_token, 'Gen'):
            return True
        if current_token.tag_ in ('ART', 'DET', 'APPR', 'APPRART') and DeGramHelper.hasChildNKWithCase(current_token, 'Acc'):
            return True
        if current_token.tag_ in ('ART', 'DET' ) and DeGramHelper.hasChildNKWithCase(current_token, 'Nom'):
            return True
        if current_token.dep_ in ('pd', 'svp', 'oa', 'sb'):
            return True
        if current_token.text in ("mir", "dir", "sich", "euch", "uns"):
            return True
        if current_token.text in ('zu', 'beim') and current_token.dep_ == "mnr":
            return True
        if current_token.tag_ in ("VVPP", 'PTKVZ'):
            return True
        if current_token.pos_ in ("VERB", "AUX") or ( current_token.pos_ in ( "PART") and not fix_dat):
            return True
        if current_token.head.dep_ == "relcl" and current_token.dep_ != "da" and previous_token.dep_ != "det":
            return True
        return False     
    
    
    def evaluateDativ(self, token,  fix_dat, acc_prep):
        # Basic checks that apply to all subsequent conditions
        if token.dep_ == "punct" or token.tag_ == "HYPH": return False

        # Specific conditions
        is_da = token.dep_ == "da"
        is_head_da = token.head.dep_ == "da"
        is_verb_or_aux = token.head.pos in ("VERB", "AUX") or token.head.head.pos in ("VERB", "AUX")
        is_appropriate_tag = token.tag_ in ['PTKA', 'APPRART', 'APPR']
        is_not_in_or_prep = token.tag_ != "IN" and token.dep_ != "prep"
        has_previous_dep = token.i > 0 and (token.doc[token.i - 1].dep_)

        return (
            (is_da and is_verb_or_aux  ) or
            (is_head_da  and is_not_in_or_prep and is_verb_or_aux) or
            (token.head.dep_ in ("poss", "nummod") and token.head.head.dep_ == "sb") or
            ( ( token.tag_ == 'PTKA' or token.tag_ == 'APPR' or token.tag_ ==  'APPRART' )  and fix_dat) or
            (acc_prep and is_appropriate_tag) or
            (is_da  or (is_head_da and token.pos != "VERB" and token.dep != "prep") and has_previous_dep)
        )
                            
                    
    def buildDativ(self, token: spacy.tokens.doc.Token):
        if self.isNext(token.i) == True:
            if ( token.pos_ in  [ 'VERB', "AUX" , "CCONJ" ]) : return 
            
            acc_prep = False
            fix_dat = False
          
            dat_prepositions = { 'zur', "im",  "aus", "bei", "beim", "mit", "nach", "seit", "von", "zu", "gegenüber", "außer", "am", "im", "ans", "zum"}
            fix_dat = token.text.lower() in dat_prepositions
            
            acc_prep = (token.tag_ == 'APPR' and DeGramHelper.hasChildNKWithCase(token, 'Dat')) or \
                            (token.tag_ == 'APPRART' and DeGramHelper.getMorphology(token=token, aspect='Case') == 'Dat')
            
            if self.evaluateDativ( token,  fix_dat, acc_prep):
                stop_idx = token.head.i if token.dep_ == "da" else token.head.head.i
                stop_idx = max(stop_idx, token.i, len(self.document))
                captured_tokens = []

                for i in range(token.i, stop_idx):
                    current_token = token.doc[i]
                    previous_token = token.doc[i - 1] if i > 0 else None
                    #  
                    if  (   ( self._shouldBreakInLoop(current_token, previous_token, fix_dat) == True or (  len(captured_tokens) > 1  and current_token.text.lower() in prepositions )) ):
                        if ( ( len(captured_tokens) > 0  and current_token.text  in reflexive_pronouns and current_token.pos_ == 'PRON' )):
                            captured_tokens.append(token.doc[i])
                            break
                        break
                    else: 
                        captured_tokens.append(token.doc[i])
                    
                if ( token.tag_ == 'PRELS' ):
                    self.textSpan.children.append(TextSpan._init("←...", "tag"))
                    self.textSpan.children.append(TextSpan._init("  ", "X1"))
                    
                self.textSpan.children.append(TextSpan._init("→\\", "tag"))
                
                for t in captured_tokens:
                    tag_str = t.tag_ if t.tag_ in ("NN", "RB") else t.tag_ + "_" + t.dep_
                    if t.dep_ == "ng": tag_str = "Neg"
                    tag_gender = DeGramHelper.getFunction(token=t, ending=True)
                    if ( tag_gender != None): tag_str =  tag_gender
                    textSpan = TextSpan._init(text=t.text_with_ws, tag=tag_str)
                    self.textSpan.children.append(textSpan)
                    
                if captured_tokens: self.moveCursor(captured_tokens[-1].i)
                    
    def shouldProcessGenitive(self, token, fix_gen, gen_prep):
            return (
                token.dep_ not in {'punct', 'HYPH'} and
                (
                    (token.dep_ in {'ag', 'pg'} and token.head.pos_ in {'VERB', 'AUX'}) or
                    (token.head.dep_ == 'ag' and token.head.head.pos_ == 'NOUN') or
                    fix_gen or
                    (gen_prep and token.tag_ in {'APPRART', 'APPR', 'ART'}) or
                    (token.dep_ in {'ag', 'pg'} or (token.head.dep_ == 'ag' and token.pos_ != 'VERB' and token.dep_ != 'prep')) and
                    token.i > 0 and token.doc[token.i - 1].dep_
                )
            )
         
    def shouldBreakGenitive(self, current_token, fix_gen):
        return (
            ( current_token.dep_ in {'punct', 'aux', 'ng', 'mnr', 'sb', 'svp', 'pm', 'cd', } and not fix_gen) or
            (current_token.dep_ == 'sb' and  current_token.pos == 'PRON'  and  current_token.pos == 'PPER' )  or
           (current_token.dep_ == 'sb' and  current_token.i == 1 )  or
           ( current_token.dep_ == 'mnr' and not fix_gen ) or
           
            (  current_token.tag_ == 'PIAT' and current_token.dep_ == 'nk' and ( current_token.head.dep_ == 'oa' or  current_token.head.dep_ == 'da') )  or
            ( current_token.tag_ in ( 'APPR' , 'ART' )  and fix_gen == False and current_token.dep_ != 'pg' and DeGramHelper.hasChildNKWithCase(current_token, 'Dat') ) or
            ( current_token.tag_ in ( 'APPR' , 'ART' )   and DeGramHelper.hasChildNKWithCase(current_token, 'Acc') ) or
            current_token.tag_ == 'APPRART' or
            current_token.pos_ in {'VERB', 'AUX', 'PTKVZ', 'VVPP', 'PART'} or
          (  current_token.tag_ == 'ADJD' and current_token.head.pos_ == 'AUX'),
        )
             
    def buildGenetiv(self, token: spacy.tokens.doc.Token):
        if self.isNext(token.i) == True:
            if ( token.pos_ in {'VERB', 'AUX', 'CCONJ'}) : return 
        
            gen_prep = False
            genitive_prepositions = {'trotz', 'während', 'wegen', 'außerhalb', 'innerhalb', 'oberhalb', 'unterhalb', 'diesseits', 'jenseits', 'unweit'}
            genitive_prepositions_fix = {'trotz' }
            fix_gen = token.text.lower() in genitive_prepositions
            fix_gen_split = token.text.lower() in genitive_prepositions_fix
                
            if token.tag_ in {'APPR', 'ART'} and token.dep_ != 'pg':
                gen_prep = DeGramHelper.hasChildNKWithCase(token, 'Gen')
                if not gen_prep: 
                    pass
            else: 
                gen_prep = False
 
            if self.shouldProcessGenitive(token, fix_gen, gen_prep):
                stop_idx = token.head.i if token.dep_ == "ag" else token.head.head.i
                stop_idx = max(stop_idx, token.i, len(self.document))
                captured_tokens = []

                for i in range(token.i, stop_idx):
                    current_token = token.doc[i]
                    if self.shouldBreakGenitive(current_token, fix_gen)[0] == True or fix_gen_split: 
                        break
                    else: 
                        captured_tokens.append(token.doc[i])
                        
                if ( token.tag_ == 'PRELS' ):
                    self.textSpan.children.append(TextSpan._init("←...", "tag"))    
                    self.textSpan.children.append(TextSpan._init("  ", "X1"))  
                     
                self.textSpan.children.append(TextSpan._init("\?", "tag"))
                
                for t in captured_tokens:
                    tag_str = "Neg" if t.dep_ == "ng" else (t.tag_ if t.tag_ in {"NN", "RB"} else t.tag_ + "_" + t.dep_)
                    tag_gender = DeGramHelper.getFunction(token=t, ending=True)
                    if tag_gender is not None: tag_str = tag_gender
                    textSpan = TextSpan._init(text=t.text_with_ws, tag=tag_str)
                    self.textSpan.children.append(textSpan)
                    
                if captured_tokens: self.moveCursor(captured_tokens[-1].i)
                
                

                
    def buildAkkusativ(self, token: spacy.tokens.doc.Token):
        if self.isNext(token.i) == True:
            if ( token.pos_ in  [ 'VERB', "AUX", "CCONJ" ] 
                # mindestens einen durchschnittlichen Lohn bekommen
                or ( token.pos_ ==  'ADV' and token.dep_ == 'mo' and  token.text.lower() not in accusative_prepositions) or token.dep_ == 'da' ) :  return 
            token_text = token.text_with_ws.strip().lower()
            next_token_text = self.document[token.i + 1].text_with_ws.strip().lower() if token.i + 1 < len(self.document) else ""
            combined_text = f"{token_text} {next_token_text}".strip()
            fix_acc = False
            fix_acc = token.text.lower() in accusative_prepositions or ( token.text.lower() == 'bis' and token.pos_ != 'CCONJ')  or  combined_text in (exp.lower() for exp in temporal_expressions)
            
            if ( token.dep_ == 'svp' and token.text.lower() == 'um'  ):
                fix_acc = False
            
            if not fix_acc:
                if token.tag_ in ( 'PIAT' , 'CARD')  and token.head.tag_ == 'NN' and DeGramHelper.getMorphology(token=token.head, aspect='Case') == 'Acc':
                    fix_acc = True
                elif token.tag_ == 'PDS' and token.dep_ == 'oa':
                    fix_acc = True
                elif token.dep_ == 'oa':
                    fix_acc = True
                elif token.text == 'ein' and token.head.text == 'bisschen' and token.head.head.dep_ == 'oa':
                    fix_acc = True
                elif token.tag_ in accusative_tags and not DeGramHelper.hasChildNKWithCase(token, 'Acc'):
                    return

                
            # Prep object set
            if ( token.tag_ ==  'APPRART' or token.tag_ ==  'DET'   or token.tag_ ==  'CARD' or token.tag_ ==  'ART'):
                tagS = DeGramHelper.getMorphology(token=token, aspect = 'Case')   
                if tagS == 'Acc':  fix_acc = True
                elif tagS == 'Dat':  return
 
            if ( token.dep_ == 'op' and  token.tag_ ==  'APPR' and token.text.lower() == 'über'):  fix_acc = True
    
            # pronouns    
            if (  ( ( token.tag_ == 'PPER' and token.pos_ == 'PRON' ) or token.tag_ == 'PRF'  and token.dep_ == 'oa')  ) :
                self.textSpan.children.append(TextSpan._init("/→", "tag"))
                self.textSpan.children.append(TextSpan._init(text=token.text_with_ws, tag=DeGramHelper.getFunction(token=token, ending=True)))
                self.moveCursor(token.i)
                return
            
            
            not_punct_or_hyph = token.dep_ != "punct" and token.tag_ != "HYPH"
            is_oa_and_verb_aux = token.dep_ == "oa" and token.head.pos_ in ("VERB", "AUX")
            is_with_prep =token.text.lower() in  prepositions and DeGramHelper.hasChildNKWithCase(token, 'Acc')
            is_head_oa_and_not_in_relcl = token.head.dep_ == "oa" and token.tag_ != "IN" and token.dep_ != "relcl" and token.head.head.pos_ in ("VERB", "AUX")
            is_oa_or_head_oa_and_not_verb_prep = (token.dep_ == "oa" or (token.head.dep_ == "oa" and token.pos_ != "VERB" and token.dep_ != "prep")) and token.doc[token.i - 1].dep_ and token.i > 0    
            condition_met = is_oa_and_verb_aux or is_with_prep or is_head_oa_and_not_in_relcl or is_oa_or_head_oa_and_not_verb_prep or fix_acc
            
            
            if not_punct_or_hyph and condition_met:
                stop_idx = token.head.i if token.dep_ == "oa" else token.head.head.i
                stop_idx = max(stop_idx, token.i, len(self.document))
                captured_tokens = []

                for i in range(token.i, stop_idx):
                    current_token = token.doc[i]
                    if any([
                        current_token.dep_ in ('punct', 'aux', 'ng', 'mnr', 'sb', 'svp', 'pm', 'cd') and current_token.tag_  != 'APPR' and token.text.lower() not in accusative_prepositions,
                        current_token.text in ('-',) + tuple(personal_pronouns) + tuple(reflexive_pronouns) and  ( len(captured_tokens) > 0 and current_token.tag_ != 'PPER'  ),
                        current_token.tag_ in ('APPR', 'APPRART', 'PTKZU',) and DeGramHelper.hasChildNKWithCase(current_token, 'Dat') and fix_acc == False,
                        DeGramHelper.hasChildNKWithCase(current_token, 'Gen'),
                        current_token.pos_ in ('VERB', 'AUX', 'PTKVZ', 'VVPP', 'PART'),
                        current_token.tag_ == 'ADJD' and current_token.head.pos_ == 'AUX',
                        current_token.tag_ == 'PRELS' and  len(captured_tokens) >  0,
                        current_token.head.dep_ == 'sb' and current_token.dep_ == 'nk',
                        current_token.head.dep_ == 'relcl' and current_token.dep_ != 'oa' and (current_token.i > 0 and token.doc[current_token.i - 1].dep_ != 'det'),
                        len(captured_tokens) > 0 and current_token.text.lower() in accusative_prepositions , 
                        len(captured_tokens) > 0 and current_token.text.lower() in  prepositions,
                       
                        len(captured_tokens) > 1 and ( current_token.tag_ == 'ART' or current_token.tag_ == 'DET' ) and token.text.lower() not in accusative_prepositions
                    ]):
                        break
                    else:
                        captured_tokens.append(token.doc[i])
                        
                if ( token.tag_ == 'PRELS' ):
                    self.textSpan.children.append(TextSpan._init("←...", "tag"))
                    self.textSpan.children.append(TextSpan._init("  ", "X1"))
                self.textSpan.children.append(TextSpan._init("/→", "tag"))
                
            
                for t in captured_tokens:
                    tag_str = t.tag_ if t.tag_ in ('NN', 'RB') else t.tag_ + '_' + t.dep_
                    tag_str = 'Neg' if t.dep_ == 'ng' else tag_str
                    tag_gender = DeGramHelper.getFunction(token=t, ending=True) or tag_str
                    textSpan = TextSpan._init(text=t.text_with_ws, tag=tag_gender)
                    self.textSpan.children.append(textSpan)  
                    
                if not captured_tokens: pass
                else: self.moveCursor(captured_tokens[-1].i)

    def buildSubject(self, token: spacy.tokens.doc.Token):
        if self.isNext(token.i) == True:
            fixSubjectTag = False
            #Teilnahme an Sprachcafés (op)
            if ( token.text.lower() in [  'mal', 'nur', 'auch', 'dass' ] or token.dep_ == 'op'  or token.pos_ in  [ 'VERB', "AUX" , 'CCONJ' ] or token.dep_ == 'mnr' or token.dep_ == 'pg')  or  (  token.dep_ == 'mo' and token.pos_ ==  'ADP'):
            # Vor allem die bürokratischen Hürden sind dabei aber ein Problem
                return
            # Zu hohe Kosten.
            if ( token.head.head.tag_ == 'NN' and token.head.tag_ == 'ADJA' and  token.text.lower() == 'zu' and  token.tag_ == 'PTKA' ):
                fixSubjectTag   = True
            
            # Das Wichtigste ist, dass sie glücklich ist.
            if ( token.dep_ == 'pd' and token.head.pos_  in (  'AUX', 'VERB' )  ):
                return
                
            # Ein bisschen Geduld ist notwendig.            
            if ( token.head.head.dep_ == 'sb' and token.head.tag_ == 'PIAT' ):
                fixSubjectTag   = True
            
            if ( token.head.head.dep_ == 'sb' and token.tag_ == 'PDS' and token.pos_ == 'PRON' ):
                fixSubjectTag   = True
                
            if (
                self.isNext(token.i)
                and token.dep_ != "relcl"
                and ("self" not in token.text and "selves" not in token.text)
                and (token.dep_ != "punct" and token.tag_ != "HYPH")
             
                and (  
                    (  token.dep_ in ["sb", "ep"]  and token.head.pos_ in ("VERB", "AUX") )
                    or (  token.head.dep_ in ["sb", "ep"]
                        and (token.tag_ != "IN" and token.dep_ != "relcl")
                        and token.head.head.pos_ in ("VERB", "AUX")
                    )
                    or  fixSubjectTag == True
                    or (  token.head.dep_ in ("poss", "nummod") and token.head.head.dep_ in ["sb", "ep"] )
                    or (
            
                        (
                            token.dep_ in ["sb", "ep"]
                            
                            or (
                                token.head.dep_ in ["sb", "ep"]
                                and token.pos_ != "VERB"
                                # Bug 21.09.23 effects on menthal health
                                and token.dep_ != "prep"
                            )
                        )
                        and (token.doc[token.i - 1].dep_)
                        and token.i > 0
                    )
                    or ( token.tag_ == 'NN' and  token.pos_ == 'NOUN' and token.i == 0  )
                    or ( token.i == 0 and token.dep_ == 'nk' and DeGramHelper.hasChildNKWithCase(token, 'Nom'))
                    
                )
            ):
                stop_idx = token.head.i if token.dep_ in ["sb", "ep"] else token.head.head.i
                
                

                stop_idx = max(stop_idx, token.i, len(self.document))

                captured_tokens = []

                for i in range(token.i, stop_idx):
                    
                    if (  ( token.doc[i].dep_ in ("punct", "aux", "acomp")  and token.doc[i].text != "-" )
                        or (  token.doc[i].pos_ in ("VERB", "AUX")     )
                        or DeGramHelper. hasChildNKWithCase(token.doc[i], 'Gen') 
                        or ( token.doc[i].tag_ == 'APPRART' or   token.doc[i].tag_ == 'APPR' )
                        or  token.doc[i].tag_ == 'PTKZU'
                        or ( token.doc[i].dep_ == 'oa' or token.doc[i].dep_ == "da"   or token.doc[i].dep_ == "ng" 
                            
                            or  token.doc[i].head.dep_ == 'oa' or token.doc[i].dep_ == "da" )
                            or ( token.doc[i].dep_ == 'svp'   )   or ( token.doc[i].dep_ == 'op'   ) 
                            or ( token.doc[i].dep_ == 'pd'   )
                                or ( token.doc[i].text == ','   or   token.doc[i].text == '.'  or   token.doc[i].text == '?'
                                    or   token.doc[i].text == '!')
                        or (
                            token.doc[i].head.dep_ == "relcl"
                            and token.doc[i].dep_ != "sb"
                            # The strategy that the coach used was innovative.
                            and (token.doc[i - 1].dep_ != "det" and i > 0)
                        )
                        or (  token.doc[i].tag_ == 'ADJD' and token.doc[i].head.pos_ == 'AUX' )
                        or  ( token.doc[i].tag_ in [ 'APPR','ART'  ]  and  DeGramHelper.hasChildNKWithCase(token.doc[i], 'Dat') )
                        or ( token.doc[i].tag_  in [ 'APPR','ART'  ] and  DeGramHelper.hasChildNKWithCase(token.doc[i], 'Acc') )
                    ):
                        break
                    else:
                        captured_tokens.append(token.doc[i])
                        
                        
                # When transitive verb before, then do not put Subject by mistake
                if (  ( token.head.dep_  in ["sb", "ep"]
                            and token.head.head.dep_ == "ccomp"
                            and token.head.head.tag_ == "JJR" ) or ( token.dep_  in ["sb", "ep"]
                        and token.head.dep_ == "ccomp"
                        and token.head.tag_ == "JJR"
                    )
                ):
                    pass
                else:
                    subjectTag = 'S'
                    
                    isSetAsPassive: bool = False
               
                    if ( token.dep_ in ["sb", "ep"] ):
                        isSetAsPassive = DeGramHelper.isPassiv(token)
                    if ( token.dep_ in ["sb", "ep"] and  isSetAsPassive == False  ):
                        isSetAsPassive = DeGramHelper.isPassivModal(token)
                    if (  token.head.dep_ in ["sb", "ep"] ):
                        isSetAsPassive = DeGramHelper.isPassiv(token.head)
                    if isSetAsPassive == True:
                        subjectTag = "S*"
                        
                    if ( token.tag_ == 'PRELS' or  token.tag_ == 'PRELAT'  ):
                        self.textSpan.children.append(TextSpan._init("←...", "tag"))    
                        self.textSpan.children.append(TextSpan._init("  ", "X1"))        
                    self.textSpan.children.append(TextSpan._init(subjectTag, "tag"))
                    
                for t in captured_tokens:
                    tag_str = t.tag_ if t.tag_ in ("NN", "RB") else t.tag_ + "_" + t.dep_
                    if t.dep_ == "ng":
                        tag_str = "Neg"
                        
                    tag_gender = DeGramHelper.getFunction(token=t, ending=True)
                    if ( tag_gender != None):
                        tag_str =  tag_gender
 

                    textSpan = TextSpan._init(text=t.text_with_ws, tag=tag_str)
                    self.textSpan.children.append(textSpan)
                if not captured_tokens:
                  pass
                else:
                    self.moveCursor(captured_tokens[-1].i)
                    
                    
    # Sie erweiterte ihr Wissen, ohne dass es sie viel Zeit kostete.           
    def buildComplexCoord(self, token: spacy.tokens.doc.Token):
        if self.isNext(token.i) == True:
            # Sie übt Klavier, so dass sie besser wird.
            if ( ( token.tag_ == 'APPR' or ( token.tag_ == 'ADV' and token.text  == 'so') ) and token.doc[token.i + 1].tag_ == 'KOUS' ):
                self.textSpan.children.append(TextSpan._init(text="←...", tag="tag"))
                self.textSpan.children.append(TextSpan._init(token.text_with_ws, tag= "HL"))
                self.textSpan.children.append(TextSpan._init( token.doc[token.i + 1].text_with_ws,"HL"))
                self.moveCursor(token.i + 1)
            
    def buildQuestIntro(self, token: spacy.tokens.doc.Token):
        if self.isNext(token.i) == True:
            # Wie gross
            if (  token.tag_ == 'PWAV' and token.i == 0  and     token.doc[token.i + 1].pos_  in ( 'ADV', 'DET') ):
                self.textSpan.children.append(TextSpan._init(token.text_with_ws, tag= "PWAV"))
                self.textSpan.children.append(TextSpan._init( token.doc[token.i + 1].text_with_ws,"PWAV"))
                self.moveCursor(token.i + 1)
            
            if (  token.tag_ == 'PWAV' and token.i == 0  and  token.dep_ =='op'  ):
                self.textSpan.children.append(TextSpan._init(token.text_with_ws, tag= "PWAV"))
                self.moveCursor(token.i )
                
    def buildUsual(self, token: spacy.tokens.doc.Token):
        if self.isNext(token.i) == True:
            # Wie gross
            if (  token.text == 'bitte' ):
                self.textSpan.children.append(TextSpan._init(token.text_with_ws, tag= "U"))
                self.moveCursor(token.i )
                return
                
            if ( token.i == 0 and token.head.text == token.text)  and  ( token.i + 1 < len(token.doc)  and token.doc[token.i + 1].text == 'mal') :
                textSpan = TextSpan._init(text="", tag="Verb-Mark")
                children_data = [ ("V" , "tag"),
                        (token.text_with_ws, token.tag_)  ]
                for text, tag in children_data: 
                    textSpan.children.append(TextSpan._init(text, tag))
                self.textSpan.children.append(textSpan)
                self.moveCursor(token.i )
                return
                
            if ( (  token.i == 0 and DeGramHelper.hasVerbImerativ(token)  and token.pos_ == 'NOUN') or (  token.tag_ == 'VVFIN' and token.pos_ == 'X')):
                textSpan = TextSpan._init(text="", tag="Verb-Mark")
                children_data = [ ("V" , "tag"),
                        (token.text_with_ws, token.tag_)  ]
                for text, tag in children_data: textSpan.children.append(TextSpan._init(text, tag))
                self.textSpan.children.append(textSpan)
                self.moveCursor(token.i )
                return
    
            
    def buildOther(self, token: spacy.tokens.doc.Token):
        if self.isNext(token.i) == True:
            self.textSpan.children.append(Word(token).get())
            self.moveCursor(token.i)
            
    def buildPunct(self, token: spacy.tokens.doc.Token):
        if self.isNext(token.i) == True and token.text == ',' or token.text == '!'  or token.text == '?' or token.text == '.':
            self.textSpan.children.append(TextSpan._init(text=token.text_with_ws, tag=""))
            self.moveCursor(token.i)
            
    def buildSkip(self, token: spacy.tokens.doc.Token):
        if self.isNext(token.i) == True and token.dep_  == 'app' :
            self.textSpan.children.append(TextSpan._init(text=token.text_with_ws, tag=""))
            self.moveCursor(token.i)
            
        if self.isNext(token.i) == True and token.dep_  == 'cm' and  token.tag_  == 'KOKOM' :
            self.textSpan.children.append(TextSpan._init(text=token.text_with_ws, tag=""))
            self.moveCursor(token.i)
            
 
 
    def buildParticle2Adv(self, token: spacy.tokens.doc.Token):
        if not self.isNext(token.i): return
        # am meisten
        if token.tag_ == "PTKA" and token.dep_  == 'pm' and  token.i + 1 < len(self.document) and token.text.lower() != 'am'  and token.text != "am" and token.text != "im" and token.text != "ans" and token.text != "zum":
            textSpan = TextSpan._init(text="", tag="PTKA")
            children_data = [ (token.text_with_ws, token.tag_),
                    (self.document[token.i + 1].text_with_ws, self.document[token.i + 1].tag_), ]
            for text, tag in children_data: textSpan.children.append(TextSpan._init(text, tag))
            self.textSpan.children.append(textSpan)
            self.moveCursor(token.i + 1)

    def buildParticle(self, token: spacy.tokens.doc.Token):
        if not self.isNext(token.i): return
        if ( token.text.lower() in ("nicht", "kein", "nein") or token.dep_ == "ng" ) and token.dep_ != 'nk':
            self.textSpan.children.append(TextSpan._init(token.text_with_ws, "Neg"))
            self.moveCursor(token.i)
            return

        # advcl: An adverbial clause
        if token.pos_ in ("PART") and token.head.tag_ in ( 'VVINF' , 'VAINF', 'VMINF'):
            textSpan = TextSpan._init(text="", tag="Verb-Mark")
            children_data = [ ("vI" , "tag"),
                    (token.text_with_ws, token.tag_),
                    (token.head.text_with_ws, token.head.tag_), ]
            for text, tag in children_data: textSpan.children.append(TextSpan._init(text, tag))
            self.textSpan.children.append(textSpan)
            self.moveCursor(token.i + len(children_data) - 2)

 
    # ----------------------------------> Morphology
    def getMorphology(self, token: spacy.tokens.doc.Token, aspect: str): 
        return token.morph.to_dict().get(aspect)

    # ----------------------------------> Token-Cursor
    def moveCursor(self, tokenId: int):
        if tokenId >= self.nextTokenID: self.nextTokenID = tokenId + 1

    # ----------------------------------> Get Results
    def get(self):
        return self.textSpan

    # ----------------------------------> Next Iteration
    def isNext(self, id: int = 0):
        return True if (id == self.nextTokenID or self.nextTokenID == 0) else False
