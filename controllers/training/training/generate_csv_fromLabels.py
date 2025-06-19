import sqlite3
import csv

# Connect to the SQLite3 database
conn = sqlite3.connect('database.db')
cursor = conn.cursor()

# Execute the query to retrieve data from the 'IName' field in the 'Labels' table
cursor.execute("SELECT IName FROM Labels")

# Fetch all rows from the executed query
rows = cursor.fetchall()

# Open a CSV file to write the data
with open('output.csv', 'w', newline='') as csvfile:
    csvwriter = csv.writer(csvfile)
    
    # Write the header
    csvwriter.writerow(['IName'])
    
    # Write the data rows
    csvwriter.writerows(rows)

# Close the database connection
conn.close()

print("Data has been successfully written to output.csv")


