import site
import os  # Import the os module

# # Get a list of directories where Python packages are installed
# site_packages = site.getsitepackages()

# # Search for the 'spacy' directory
# for path in site_packages:
#     spacy_path = os.path.join(path, 'spacy')  # Use os.path.join to create the path
#     if os.path.exists(spacy_path):
#         print(f"spaCy is installed at: {spacy_path}")
#         break
import spacy.util

# Get the path to the en_core_web_trf package
package_path = spacy.util.get_package_path("en_core_web_trf")

print(f"Path to en_core_web_trf: {package_path}")