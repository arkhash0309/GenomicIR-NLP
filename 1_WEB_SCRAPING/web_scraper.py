import requests
import pandas as pd
from bs4 import BeautifulSoup
import time

"""
    This Python script will be used to crawl research papers from the www.biorxiv.org website specifically for genomics related research.
"""

# URL of the genomics collection
BASE_URL = "https://www.biorxiv.org"
GENOMICS_URL = "https://www.biorxiv.org/collection/genomics"

# Function to extract papers from a single page
def get_research_papers_from_page(page_url):
    print(f"Fetching: {page_url}")
    
    # Send request
    response = requests.get(page_url, headers={"User-Agent": "Mozilla/5.0"})
    if response.status_code != 200:
        print("Failed to fetch webpage. Skipping...")
        return []

    # Parse HTML
    soup = BeautifulSoup(response.text, "html.parser")
    articles = soup.find_all("div", class_="highwire-cite")
    
    papers = []
    for article in articles:
        try:
            # Extract Title
            title_tag = article.find("span", class_="highwire-cite-title")
            title = title_tag.text.strip() if title_tag else "N/A"

            # Extract Authors
            authors_tag = article.find("div", class_="highwire-citation-authors")
            authors = authors_tag.text.strip() if authors_tag else "N/A"

            # Extract DOI
            doi_tag = article.find("span", class_="highwire-cite-metadata-doi")
            doi = doi_tag.text.strip().replace("doi: ", "") if doi_tag else "N/A"

            # Extract Publication Date
            date_tag = article.find("span", class_="highwire-cite-metadata-date")
            date = date_tag.text.strip() if date_tag else "N/A"

            # Extract Paper Link
            paper_link_tag = article.find("a", class_="highwire-cite-linked-title")
            paper_url = BASE_URL + paper_link_tag["href"] if paper_link_tag else "N/A"

            # Store paper details
            papers.append({
                "Title": title,
                "Authors": authors,
                "DOI": doi,
                "Date": date,
                "Paper URL": paper_url
            })
        except Exception as e:
            print(f"Error parsing article: {e}")

    return papers
    
# Function to scrape first 1500 pages
def get_first_1500_pages():
    all_papers = []
    for page in range(1500):  # Loop through the first 1500 pages
        print(f"Scraping page {page}...")
        page_url = f"https://www.biorxiv.org/collection/genomics?page={page}"
        papers = get_research_papers_from_page(page_url)

        if not papers:  # Stop if no more papers are found
            break

        all_papers.extend(papers)
        # time.sleep(2)  # Add a delay to avoid getting blocked

    crawled_df = pd.DataFrame(all_papers)
    rows = len(crawled_df)
    crawled_df.to_csv(f"crawl_outputs/biorxiv_genomics_papers_{rows}.csv", index=False)
    print(f"Scraped {len(crawled_df)} papers from the first {page} pages and saved to CSV.")

# Main function
if __name__ == "__main__":
    get_first_1500_pages()