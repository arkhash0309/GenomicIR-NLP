import pymongo
import pandas as pd
from pymongo.server_api import ServerApi

# MongoDB connection
MONGO_URI = "personal_mongo_db_connection_string"

# Connect to MongoDB
client = pymongo.MongoClient(MONGO_URI, server_api=ServerApi('1'))
db = client['GenomicsDB'] # create the database
collection = db['ResearchPapers'] # create the collection

# Load the CSV file containing cralwed research papers
crawled_df = pd.read_csv('../1_WEB_SCRAPING/crawl_outputs/biorxiv_genomics_papers_7070.csv')

# Convert the dataframe to list of dictionaries
data = crawled_df.to_dict(orient='records')

# Insert into MongoDB
collection.insert_many(data)
print(f"Successfully inserted {len(data)} records into MongoDB Atlas!")

# Verify by fetching first 5 records
for doc in collection.find().limit(5):
    print(doc)