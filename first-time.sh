#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print a styled message
print_message() {
  echo -e "${GREEN}==>${NC} $1"
}

# Print a section header
print_header() {
  echo -e "\n${BLUE}===== $1 =====${NC}\n"
}

# Print a warning
print_warning() {
  echo -e "${YELLOW}Warning:${NC} $1"
}

# Print an error
print_error() {
  echo -e "${RED}Error:${NC} $1"
}

# Ask yes/no question
ask_yes_no() {
  while true; do
    read -p "$1 (y/n): " yn
    case $yn in
      [Yy]* ) return 0;;
      [Nn]* ) return 1;;
      * ) echo "Please answer y or n.";;
    esac
  done
}

# Ask for API key
ask_for_key() {
  local key_name=$1
  local skip_option=$2
  local default_value=$3

  if [ "$skip_option" = true ]; then
    if ask_yes_no "Do you want to provide a $key_name API key?"; then
      read -p "Enter your $key_name API key: " api_key
      echo "$api_key"
    else
      echo "$default_value"
    fi
  else
    read -p "Enter your $key_name API key: " api_key
    if [ -z "$api_key" ]; then
      echo "$default_value"
    else
      echo "$api_key"
    fi
  fi
}

clear
echo -e "${CYAN}"
cat << "EOF"
  _____      _ _     _____ _             _      ____        _ _                 _       _
 |  ___|   _| | |   / ____| |           | |    |  _ \      (_) |               | |     | |
 | |_ _  _| | | |  | (___ | |_ __ _  ___| | __ | |_) | ___  _| | ___ _ __ _ __ | | __ _| |_ ___
 |  _| |/ / | | |   \___ \| __/ _` |/ __| |/ / |  _ < / _ \| | |/ _ \ '__| '_ \| |/ _` | __/ _ \
 | | |   <| | | |   ____) | || (_| | (__|   <  | |_) | (_) | | |  __/ |  | |_) | | (_| | ||  __/
 |_| |_|\_\_|_|_|  |_____/ \__\__,_|\___|_|\_\ |____/ \___/|_|_|\___|_|  | .__/|_|\__,_|\__\___|
                                                                         | |
                                                                         |_|
EOF
echo -e "${NC}"

print_header "Welcome to the First-Time Setup"

print_message "This script will help you set up your environment for the Full Stack Application Boilerplate."
print_message "We'll generate the necessary .env files based on your inputs."
echo

# Check for required tools
print_header "Checking Prerequisites"

# Check for Docker
if ! command -v docker &> /dev/null; then
  print_warning "Docker not found. Some features may not work correctly."
  print_message "Please install Docker from https://docs.docker.com/get-docker/"
else
  print_message "Docker is installed."
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
  print_warning "Node.js not found. Frontend development might be limited."
  print_message "Please install Node.js from https://nodejs.org/"
else
  node_version=$(node -v)
  print_message "Node.js is installed (${node_version})."
fi

# Check for Python
if ! command -v python3 &> /dev/null; then
  print_warning "Python 3 not found. Backend development might be limited."
  print_message "Please install Python 3 from https://www.python.org/downloads/"
else
  python_version=$(python3 --version)
  print_message "Python is installed (${python_version})."
fi

# Set up Supabase
print_header "Supabase Configuration"
print_message "Supabase is used for authentication, database, and storage."
print_message "You'll need a Supabase project to use these features."
print_message "Visit https://supabase.com/ to create a free account."

if ask_yes_no "Do you have a Supabase project?"; then
  read -p "Enter your Supabase URL: " supabase_url
  read -p "Enter your Supabase anon key: " supabase_anon_key
  read -p "Enter your Supabase service key: " supabase_service_key
else
  print_message "Skipping Supabase configuration. You can update the .env files later."
  supabase_url="https://example.supabase.co"
  supabase_anon_key="your-anon-key"
  supabase_service_key="your-service-key"
fi

# Set up LLM keys
print_header "LLM Configuration"
print_message "The boilerplate supports OpenAI and Anthropic (Claude) models."

openai_api_key=$(ask_for_key "OpenAI" true "your-openai-api-key")
anthropic_api_key=$(ask_for_key "Anthropic (Claude)" true "your-anthropic-api-key")

# Set up Qdrant
print_header "Vector Database Configuration"
print_message "The boilerplate uses Qdrant for vector database functionality."
print_message "You can use a cloud Qdrant instance or a local instance will be started automatically."

if ask_yes_no "Do you want to use a cloud Qdrant instance?"; then
  read -p "Enter your Qdrant URL: " qdrant_url
  qdrant_api_key=$(ask_for_key "Qdrant" false "your-qdrant-api-key")
  read -p "Enter your Qdrant collection name (default: default_collection): " qdrant_collection
  if [ -z "$qdrant_collection" ]; then
    qdrant_collection="default_collection"
  fi
else
  print_message "Using local Qdrant instance. No configuration needed."
  qdrant_url=""
  qdrant_api_key=""
  qdrant_collection="default_collection"
fi

# Generate .env file
print_header "Generating Environment Files"

# Create .env file
cat > .env << EOF
# Supabase configuration
SUPABASE_URL=${supabase_url}
SUPABASE_ANON_KEY=${supabase_anon_key}
SUPABASE_SERVICE_KEY=${supabase_service_key}

# LLM configuration
OPENAI_API_KEY=${openai_api_key}
ANTHROPIC_API_KEY=${anthropic_api_key}

# Vector Database configuration
QDRANT_URL=${qdrant_url}
QDRANT_API_KEY=${qdrant_api_key}
QDRANT_COLLECTION_NAME=${qdrant_collection}

# Application configuration
NODE_ENV=development
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000
EOF

# Create frontend .env
cat > frontend/.env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=${supabase_url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabase_anon_key}
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF

print_message "Environment files generated successfully!"
print_message ".env - Root environment file for Docker Compose"
print_message "frontend/.env.local - Frontend environment file"

# Final instructions
print_header "Setup Complete"
print_message "Your environment is now ready to use!"

# Database migrations information
print_header "Database Migrations"
print_message "The boilerplate supports database migrations using Supabase CLI."
print_message "To use database migrations, you'll need to install Supabase CLI:"
echo -e "  ${GREEN}brew install supabase/tap/supabase${NC}  (macOS)"
print_message "For other platforms, see: https://supabase.com/docs/guides/cli"
print_message "After installing the CLI, you'll need to link to your Supabase project:"
echo -e "  ${GREEN}supabase login${NC}"
echo -e "  ${GREEN}supabase link${NC}"
print_message "Then you can manage migrations with these commands:"
echo -e "  ${GREEN}make db-migration-new name=create_my_table${NC}  (Create a new migration)"
echo -e "  ${GREEN}make db-apply${NC}                               (Apply migrations to remote)"
echo -e "  ${GREEN}make db-status${NC}                              (Check migration status)"
print_message "For more information, see the supabase/README.md file."

echo -e "${CYAN}"
cat << "EOF"
 _   _            _     _____
| | | | __ _  ___| | __/ ____|_ __ ___   __ _
| |_| |/ _` |/ __| |/ / |   _| '_ ` _ \ / _` |
|  _  | (_| | (__|   <| |  |_| | | | | | (_| |
|_| |_|\__,_|\___|_|\_\\___|_\_| |_| |_|\__,_|

EOF
echo -e "${NC}"

echo "To start the application in development mode, run:"
echo -e "${GREEN}make dev${NC}"
echo
echo "This will start both the frontend and backend services."
echo
echo "For more commands, run:"
echo -e "${GREEN}make help${NC}"
echo
echo "Happy coding!"

# Make the script executable
chmod +x first-time.sh