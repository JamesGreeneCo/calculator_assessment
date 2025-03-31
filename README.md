# Distance Calculator

## Setup

1. Update the `.env` file with your MongoDB connection string:

2. Build and run the Docker container:
```bash
# Build the Docker image
docker build -t distance-calculator .

# Run the container
docker run -p 3000:3000 --env-file .env distance-calculator

## Accessing the App

* API runs on `http://localhost:3000`
* Endpoints:
   * `/distance`: Calculate distance between addresses
   * `/history`: View recent calculations
