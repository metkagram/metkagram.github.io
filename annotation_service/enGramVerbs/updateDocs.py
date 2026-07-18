from typing import List
import spacy
from spacy.language import Language
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore
import os
from openai import OpenAI
import json
import re

current_directory = os.path.dirname(__file__)
json_path = os.path.join(current_directory, 'verbs-in-use-firebase-adminsdk-1zvmr-b8e4a8d8fe.json')
cred = credentials.Certificate(json_path)
firebase_admin.initialize_app(cred)
db = firestore.client()

def parse_and_split_sentences(sentence_info):
    sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', sentence_info['sentence'])
    
    verb_index = 0
    parsed_sentences = []
    
    for sentence in sentences:
        sentence_verbs = []
        for verb_info in sentence_info['verbs'][verb_index:]:
            if verb_info['start'] < len(sentence):
                sentence_verbs.append(verb_info)
            else:
                break
            verb_index += 1
        
        parsed_sentences.append({'sentence': sentence, 'verbs': sentence_verbs})
        
        # Adjust the start and end positions for the next sentence
        if verb_index < len(sentence_info['verbs']):
            for i in range(verb_index, len(sentence_info['verbs'])):
                sentence_info['verbs'][i]['start'] -= len(sentence) + 1
                sentence_info['verbs'][i]['end'] -= len(sentence) + 1
                
    return parsed_sentences

def update_sentences_in_firestore(doc_id, sentences):
    try:
        # Update the document with the new sentences
        db.collection('verbs').document(doc_id).update({'verbs': sentences})
        print("Sentences updated successfully!")
    except Exception as e:
        print(f"Error updating sentences: {str(e)}")

def read_and_update_first_verb_info_from_firestore():
    try:
        # Get the first document from the 'verbs' collection
        docs = db.collection('verbs').get()
        if docs:
            for doc in docs:
                doc_id = doc.id
                data = doc.to_dict()
                print("Original Document data:")
                print(data)
                
                new_sentences = []
                update_needed = False
                for sentence_info in data.get('verbs', []):
                    split_sentences = parse_and_split_sentences(sentence_info)
                    new_sentences.extend(split_sentences)
                    if len(split_sentences) > 1:
                        update_needed = True
                
                # Update the document with the new sentences only if splitting occurred
                if update_needed:
                    # pass
                    update_sentences_in_firestore(doc_id, new_sentences)
                else:
                    print("No splitting needed; document not updated.")
        else:
            print("No documents found in the collection!")
    except Exception as e:
        print(f"Error reading and updating verb information: {str(e)}")

# Execute the function to read and update the first document
read_and_update_first_verb_info_from_firestore()