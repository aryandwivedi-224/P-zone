# PropertyZone Frontend

A modern React-based frontend application for PropertyZone, a platform to browse and view property listings. This app fetches property data from a backend API and displays it in an intuitive card-based layout.

## Features

- **Property Listings**: View a list of properties with details like title, description, price, and images.
- **Responsive Design**: Optimized for desktop and mobile devices.
- **API Integration**: Connects to a live backend API for real-time data.
- **Easy Navigation**: Simple and clean user interface.

## Tech Stack

- **Frontend**: React.js
- **HTTP Client**: Axios
- **Styling**: CSS
- **Build Tool**: Create React App

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/aryandwivedi-224/P-zone.git
   cd P-zone
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your API URL:
   ```
   REACT_APP_API_URL=https://propertyzone-gvvy.onrender.com
   ```

## Running the Application

To start the development server:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

## Building for Production

To build the app for production:

```bash
npm run build
```

This will create a `build` folder with optimized files ready for deployment.

## Deployment

The app can be deployed to platforms like Netlify, Vercel, or GitHub Pages. Ensure the `REACT_APP_API_URL` is set to the live backend URL.

## API Endpoints

- **GET /api/properties**: Fetches the list of properties.

## Contributing

1. Fork the repository.
2. Create a new branch for your feature.
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.

## License

This project is licensed under the MIT License.

## Contact

For questions or support, contact Aryan Dwivedi.

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
