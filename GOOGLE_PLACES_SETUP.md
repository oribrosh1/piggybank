# Google Places API Setup Guide

This guide will help you set up Google Places API for location autocomplete in your event creation flow.

## Prerequisites

- Google Cloud Console account
- Active Google Cloud Project

## Step-by-Step Instructions

### 1. Enable Google Places API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Library**
4. Search for and enable the following APIs:
   - **Places API** (required)
   - **Maps SDK for iOS** (if deploying to iOS)
   - **Maps SDK for Android** (if deploying to Android)
   - **Geocoding API** (recommended for better address parsing)

### 2. Create API Key

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy the generated API key
4. (Optional but recommended) Click **Restrict Key** to add security restrictions:
   - **Application restrictions**: Set iOS bundle ID and/or Android package name
   - **API restrictions**: Restrict to only the APIs you enabled above

### 3. Configure Your App

#### Option A: Using Environment Variables (Recommended for security)

1. Create a `.env` file in the project root (if it doesn't exist):
   ```bash
   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_actual_api_key_here
   ```

2. Make sure `.env` is in your `.gitignore` file (it should be by default)

#### Option B: Using app.json (Already configured)

The API key has been added to `app.json` for both iOS and Android:
- **iOS**: `expo.ios.config.googleMapsApiKey`
- **Android**: `expo.android.config.googleMaps.apiKey`

**⚠️ Important**: If using this method, make sure to update the API key in `app.json` before deploying to production.

### 4. Rebuild Your App

Since this involves native configuration changes, you'll need to rebuild your app:

```bash
# For iOS
eas build --platform ios --profile development

# For Android
eas build --platform android --profile development

# Or rebuild both
eas build --platform all --profile development
```

### 5. Test the Integration

1. Open your app
2. Navigate to **Create Event** > **Event Details**
3. Start typing in the location search field
4. You should see autocomplete suggestions from Google Places

## Troubleshooting

### API Key Not Working

1. **Check API is enabled**: Make sure Places API is enabled in Google Cloud Console
2. **Wait for propagation**: New API keys can take a few minutes to become active
3. **Check restrictions**: If you added restrictions, make sure they match your app's bundle ID/package name
4. **Check billing**: Google Places API requires billing to be enabled on your project

### No Autocomplete Suggestions

1. **Check console logs**: Look for error messages in the React Native debugger
2. **Verify API key**: Make sure the key is correctly set in your environment or app.json
3. **Check network**: Ensure your device/simulator has internet connectivity
4. **Platform-specific issues**:
   - **iOS**: Make sure you've run `pod install` after adding the configuration
   - **Android**: Make sure you've rebuilt the app with the new configuration

### Billing Concerns

- Google Places API has a free tier with $200 monthly credit
- Each autocomplete session costs approximately $0.017 (as of 2024)
- Each Place Details request costs approximately $0.017
- Monitor usage in Google Cloud Console > **APIs & Services** > **Dashboard**

## Usage in Code

The Google Places Autocomplete is already integrated in `app/create-event/event-details.tsx`:

```typescript
<GooglePlacesAutocomplete
  placeholder="Search for venue, address, or place"
  onPress={(data, details = null) => {
    // Location data is automatically parsed and saved to form
    const placeName = data.structured_formatting?.main_text || data.description;
    const streetAddress = details?.formatted_address || '';
    const cityComponent = details?.address_components?.find(
      (component) => component.types.includes('locality')
    );
    const city = cityComponent?.long_name || '';
    
    // Updates formData with: location, address, city
  }}
  query={{
    key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || 'YOUR_API_KEY',
    language: 'en',
  }}
  fetchDetails={true}
/>
```

## Additional Resources

- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service/overview)
- [react-native-google-places-autocomplete Docs](https://github.com/FaridSafi/react-native-google-places-autocomplete)
- [Google Cloud Pricing Calculator](https://cloud.google.com/products/calculator)

## Support

If you encounter issues, check:
1. Google Cloud Console for API status and quota
2. React Native debugger for error messages
3. GitHub issues for react-native-google-places-autocomplete

---

**Note**: Keep your API key secure! Never commit it to version control if using app.json method. Always use environment variables for sensitive credentials in production.

