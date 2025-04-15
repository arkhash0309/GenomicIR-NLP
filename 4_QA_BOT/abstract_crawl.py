import requests
from bs4 import BeautifulSoup
import pandas as pd
import time

# Load the csv containing the crawled metadata and URLs
df = pd.read_csv("../1_WEB_SCRAPING/crawl_outputs/biorxiv_genomics_papers_7070.csv")

# Function to extract the abstract from the given URL
def extract_abstract(url):
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers)

        if response.status_code != 200:
            print(f"Failed to fetch {url}")
            return None

        # Parse the page
        soup = BeautifulSoup(response.text, "html.parser")

        # Extract the abstract
        abstract_tag = soup.find("div", class_="abstract")
        if abstract_tag:
            return abstract_tag.text.strip()

        # If the abstract is in another HTML structure
        abstract_p = soup.find("p", class_="abstract")
        if abstract_p:
            return abstract_p.text.strip()

        return "Abstract not found"

    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None


# Crawl abstracts for each paper
abstracts = []
for index, row in df.iterrows():
    url = row["Paper URL"]
    print(f"Crawling index {index}: {url}")
    abstract = extract_abstract(url)
    abstracts.append(abstract)
    # time.sleep(1)  # Sleeping for 1 second to avoid loading the server

df['Abstract'] = abstracts
df.to_csv("output/biorxiv_genomics_papers_7070_with_abstracts.csv", index=False)
print("Crawling complete! Data saved!")