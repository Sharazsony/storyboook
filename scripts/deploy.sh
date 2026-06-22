#!/bin/bash
# ClassMind Deployment Helper Script
# This script helps you prepare for and monitor deployments

set -e

echo "🚀 ClassMind Deployment Helper"
echo "================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install it first."
    exit 1
fi
print_success "pnpm is installed"

# Menu
echo ""
echo "What would you like to do?"
echo "1) Check prerequisites"
echo "2) Build frontend for production"
echo "3) Build backend for production"
echo "4) Build both (frontend + backend)"
echo "5) View deployment guide"
echo "6) Generate security keys"
echo "7) Check for deployment issues"
echo ""

read -p "Enter your choice (1-7): " choice

case $choice in
    1)
        echo ""
        echo "📋 Checking Prerequisites..."
        echo ""
        
        # Check Node version
        node_version=$(node -v | cut -d'v' -f2)
        echo "Node version: $node_version"
        if [[ $node_version == 24* ]] || [[ $node_version == 23* ]]; then
            print_success "Node version is compatible"
        else
            print_warning "Recommended Node 24.x or 23.x (you have v$node_version)"
        fi
        
        # Check pnpm version
        pnpm_version=$(pnpm -v)
        echo "pnpm version: $pnpm_version"
        print_success "pnpm is installed"
        
        # Check git
        if command -v git &> /dev/null; then
            print_success "Git is installed"
            git status > /dev/null 2>&1 && print_success "Git repository initialized" || print_error "Not in a git repository"
        else
            print_error "Git is not installed"
        fi
        
        # Check if .env exists
        if [ -f "artifacts/api-server/.env" ]; then
            print_success "Backend .env file exists"
        else
            print_warning "Backend .env file not found. Copy from .env.example"
        fi
        
        echo ""
        print_success "Prerequisites check complete!"
        ;;
        
    2)
        echo ""
        echo "🎨 Building Frontend..."
        cd artifacts/classroom-assistant
        echo "Running: pnpm run build"
        pnpm run build
        cd ../..
        print_success "Frontend built successfully!"
        echo ""
        echo "📦 Output directory: artifacts/classroom-assistant/dist"
        echo "📤 Ready to deploy on Vercel"
        ;;
        
    3)
        echo ""
        echo "🔌 Building Backend..."
        cd artifacts/api-server
        echo "Running: pnpm run build"
        pnpm run build
        cd ../..
        print_success "Backend built successfully!"
        echo ""
        echo "📦 Output: artifacts/api-server/dist/index.mjs"
        echo "📤 Ready to deploy on Render"
        ;;
        
    4)
        echo ""
        echo "🚀 Building Both Frontend and Backend..."
        echo ""
        
        # Frontend
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🎨 Building Frontend..."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        cd artifacts/classroom-assistant
        pnpm run build
        cd ../..
        print_success "Frontend built!"
        
        echo ""
        
        # Backend
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🔌 Building Backend..."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        cd artifacts/api-server
        pnpm run build
        cd ../..
        print_success "Backend built!"
        
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        print_success "Both builds completed successfully!"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        ;;
        
    5)
        echo ""
        echo "📖 Opening Deployment Guide..."
        if command -v cat &> /dev/null; then
            cat DEPLOYMENT_GUIDE.md | head -100
            echo ""
            echo "📄 Full guide available in: DEPLOYMENT_GUIDE.md"
        else
            print_error "Cannot display guide. Please open DEPLOYMENT_GUIDE.md manually"
        fi
        ;;
        
    6)
        echo ""
        echo "🔐 Generating Security Keys..."
        echo ""
        echo "Use these keys in your .env file:"
        echo ""
        echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"
        echo "JWT_SECRET=$(openssl rand -hex 32)"
        echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)"
        echo "SESSION_SECRET=$(openssl rand -hex 64)"
        echo ""
        print_warning "⚠️  IMPORTANT: Keep these keys SECRET!"
        echo "Never commit them to git or share them publicly."
        ;;
        
    7)
        echo ""
        echo "🔍 Checking for Deployment Issues..."
        echo ""
        
        issues=0
        
        # Check environment variables
        echo "Checking environment variables..."
        if [ -f "artifacts/api-server/.env" ]; then
            if grep -q "GOOGLE_CLIENT_ID=" "artifacts/api-server/.env"; then
                print_success "GOOGLE_CLIENT_ID is set"
            else
                print_warning "GOOGLE_CLIENT_ID is missing"
                ((issues++))
            fi
            
            if grep -q "DATABASE_URL=" "artifacts/api-server/.env"; then
                print_success "DATABASE_URL is set"
            else
                print_warning "DATABASE_URL is missing"
                ((issues++))
            fi
        else
            print_warning ".env file not found"
            ((issues++))
        fi
        
        # Check build outputs
        echo ""
        echo "Checking build outputs..."
        if [ -d "artifacts/classroom-assistant/dist" ]; then
            print_success "Frontend dist/ folder exists"
        else
            print_warning "Frontend dist/ folder not found. Run: pnpm run build (from classroom-assistant)"
            ((issues++))
        fi
        
        if [ -f "artifacts/api-server/dist/index.mjs" ]; then
            print_success "Backend dist/index.mjs exists"
        else
            print_warning "Backend dist/index.mjs not found. Run: pnpm run build (from api-server)"
            ((issues++))
        fi
        
        # Check git status
        echo ""
        echo "Checking git status..."
        if git status > /dev/null 2>&1; then
            if [ -z "$(git status --porcelain)" ]; then
                print_success "All changes committed to git"
            else
                print_warning "Uncommitted changes found. Commit before deploying:"
                git status --short
            fi
        fi
        
        echo ""
        if [ $issues -eq 0 ]; then
            print_success "No issues found! Ready to deploy 🚀"
        else
            print_error "Found $issues issue(s). Please fix them before deploying."
        fi
        ;;
        
    *)
        print_error "Invalid choice. Please select 1-7."
        ;;
esac

echo ""
echo "Done!"
