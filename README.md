# Brazilian Wood E-Commerce Website

E-commerce website for building materials including adjustable pedestals, IPE wood deck, IPE lumber, concrete pavers, and green roof systems.

## Features

- React frontend with modern UI
- PHP backend API
- Product catalog with categories
- Shopping cart functionality
- Order management system
- Admin panel for order management
- Google Merchant Center integration
- WhatsApp support integration
- Responsive design

## Setup

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

### Backend Setup

1. Configure database in `api/config.php`

2. Initialize database:
```bash
php api/init_database.php
```

3. Set up PHP server (Apache/Nginx) or use PHP built-in server:
```bash
php -S localhost:80 -t .
```

## Database Configuration

- Database: u632602124_tile1
- User: u632602124_tile
- Password: 11241124Oguzhan.

## Admin Panel

Access the admin panel at `/admin`
Default password: `admin123` (change in production)

## Google Merchant Center

Google Shopping feed is available at: `/api/google-merchant/feed.php`

Update the `$baseUrl` variable in `api/google-merchant/feed.php` with your actual domain before deploying.

