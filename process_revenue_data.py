from scrape_affiliate_revenue import scrape_affiliate_revenue
import psycopg2
import json
import os
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

def check_env():
    """Check required environment variables"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise EnvironmentError("DATABASE_URL environment variable is not set")
    return database_url

def process_revenue_data():
    """Process scraped revenue data and save to database"""
    try:
        database_url = check_env()
        raw_data = scrape_affiliate_revenue()
        
        if raw_data is None:
            return None

        combined_data = {
            "platform_metrics": raw_data.get("platform_metrics", {}),
            "top_communities": []
        }

        # Process data
        earnings = raw_data.get("affiliate_earnings", [])
        communities = raw_data.get("top_communities", [])
        
        for idx, community in enumerate(communities):
            if idx < len(earnings):
                community_copy = dict(community)
                community_copy["affiliate_earnings"] = earnings[idx]
                community_copy["rank"] = idx + 1
                combined_data["top_communities"].append(community_copy)
        
        # Save to database
        try:
            print("Connecting to database...")
            conn = psycopg2.connect(database_url)
            cur = conn.cursor()
            
            cur.execute("""
                INSERT INTO whop_data (platform_metrics, top_communities)
                VALUES (%s, %s)
                RETURNING id
            """, (
                json.dumps(combined_data["platform_metrics"]),
                json.dumps(combined_data["top_communities"])
            ))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return combined_data
            
        except Exception as e:
            print(f"Database connection error: {e}")
            return None
            
    except EnvironmentError as e:
        print(f"Environment error: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None

if __name__ == "__main__":
    process_revenue_data()
