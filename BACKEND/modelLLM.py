import pymongo
import json
from together import Together
import re  # For extracting phone names from LLM response
import sys

# Configuration
MONGO_URI = "mongodb+srv://rennythomas:renny123@cluster0.7qopb.mongodb.net/scraping?retryWrites=true&w=majority"
DB_NAME = "scraping"
COLLECTION_NAME = "phonescraper"
API_KEY = "96a72cfc4a1048d826ac50f19c6db5d2bfc6af05f53601eb1c8a8182ac98bd33"

# Initialize MongoDB client
mongo_client = pymongo.MongoClient(MONGO_URI)
db = mongo_client[DB_NAME]
collection = db[COLLECTION_NAME]

# Initialize Together API client
llm_client = Together(api_key=API_KEY)

def fetch_all_phones():
    """Fetch all phone data from MongoDB, including the _id field."""
    return list(collection.find({}))

def llm_search(query: str, phones: list):
    """
    Let the LLM analyze the query and select the best phones from the database.
    Returns:
        - LLM response text
        - List of matched phones (with images and details, excluding _id)
    """
    # Format phone data concisely (include _id in the LLM input)
    phone_data = "\n".join(
        f"{idx+1}. {p['name']} (ID: {p['_id']}) (₹{p['price']}) | {p['specifications'].get('Processor', 'N/A')}, "
        f"{p['specifications'].get('Primary Camera', 'N/A')} Camera"
        for idx, p in enumerate(phones)
    )

    prompt = f"""You are NovaSpark, a phone expert. 
        A user has asked: {query}

        Here is a list of available phones:
        {phone_data}

        Your task is to analyze the user's query and recommend the best phones based on their requirements. Must follow these guidelines strictly:

        1. Understand the User's Needs:
        - Identify key aspects of the query, such as budget, brand preference, use case (e.g., gaming, camera, battery life), or specific features (e.g., processor, RAM, storage).
        - If the user mentions a budget (e.g., "under ₹20,000","under 20k,between any budget,below ,above,best..etc"), prioritize phones within that range.
        - If the user mentions a brand, prioritize phones from that brand. If the brand is unavailable, suggest alternatives and clearly state that they are not the requested brand.
        - If the need is not about phone or appreciating you then reply accordingly.

        2. Prioritize Based on Use Case:
        - Gaming Phones: Prioritize phones with powerful processors (e.g., Snapdragon 8 series, Dimensity high-end chips) and good cooling systems. Look for high refresh rate displays and ample RAM.
        - Camera Phones: Prioritize phones with high-resolution cameras, multiple lenses, and advanced camera features (e.g., optical zoom, night mode).
        - Battery Life: Prioritize phones with large battery capacities and efficient processors.
        - All-Rounders: Recommend phones that balance performance, camera quality, battery life, and price.

        3. Price-to-Performance Ratio:
        - For budget-conscious users, recommend phones that offer the best value for money. Highlight phones with good specifications.
        - For users with higher budgets, prioritize premium features and performance.

        4. Comparison and Recommendations:
        - Select the top 3 phones that best match the user's requirements.
        - Provide a comparison of the selected phones, highlighting their key features, pros, and cons.
        - If the user searches for an exact phone name, suggest only that phone.
        - If the user's requested brand or specific feature is unavailable, suggest alternatives and explain why they are good options.

        5. Keep It Concise:
        - Limit your response to under 250 words. The chat should be clear, concise, and human-like.

        6. Final Output:
        - Provide a clear and concise response with the top 3 recommendations.
        - If the user asks for an exact phone, display only that one.
        - Ensure that the response is well-structured.
        - Explain like a phone expert. Show "Selected Phones" at the end along with the response.(IMPORTANT)
        - Use this exact format for final selection:
        **Selected Phones:**
        - Exact Phone Name 1 (ID: <id_1>)
        - Exact Phone Name 2 (ID: <id_2>)
        - Exact Phone Name 3 (ID: <id_3>)

        Follow all 6 guidelines above strictly.
        """

    try:
        # Generate response from the LLM
        response = llm_client.chat.completions.create(
            model="deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",  # Updated model name
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=4096  # Increase max_tokens if needed
        )
        llm_output = response.choices[0].message.content

        # Remove content within <think> tags
        llm_output = re.sub(r'<think>.*?</think>', '', llm_output, flags=re.DOTALL)
       

        # Extract selected phone IDs from LLM response
        selected_phones = []
        match = re.search(r"\**Selected Phones:\**(.*?)$", llm_output, re.S)
     
        
        if match:
            selected_phones = re.findall(r"ID: (\w+)", match.group(1))
            

       
        # Match selected phones with full dataset using _id
        matched_phones = [p for p in phones if str(p["_id"]) in map(str, selected_phones)]



        # Remove _id from the final output
        for phone in matched_phones:
            phone.pop("_id", None)  # Remove the _id field if it exists
            

        return llm_output, matched_phones

    except Exception as e:
        return  {"response": "No internet connection", "phones": []}


# Main function to handle query (for Node.js integration)
def handle_query(user_query):
    # Fetch all phones from MongoDB, including _id
    phones = fetch_all_phones()
    if not phones:
        return {"response": "No internet connection", "phones": []}

 
    response_text, matched_phones = llm_search(user_query, phones)

       

    # Prepare the response for Node.js
    result = {
        "response": response_text,
        "phones": matched_phones  # This excludes _id
    }
    return result


# Entry point for Node.js
def main():
    if len(sys.argv) < 2:
        print(json.dumps({"response": "No query provided", "phones": []}))
        return
    
    

    user_query = sys.argv[1]
    result = handle_query(user_query)
    print(json.dumps(result))  # Convert to JSON for Node.js

if __name__ == "__main__":
    main()