// We halen useEffect en useState uit React.
// useState = iets onthouden in de app.
// useEffect = iets automatisch doen als de app start.
import { useEffect, useState } from 'react';
 
// Hier halen we onderdelen uit React Native.
// Deze onderdelen gebruiken we om het scherm te bouwen.
import {
  SafeAreaView,      // Zorgt dat de app niet onder de notch valt
  View,              // Een soort container/blok
  Text,              // Hiermee toon je tekst
  TextInput,         // Hiermee kan de gebruiker tekst invoeren
  FlatList,          // Hiermee toon je een lijst
  TouchableOpacity,  // Een klikbare knop
  StyleSheet,        // Hiermee maken we styling
  Alert,             // Hiermee tonen we een melding
  Modal,             // Hiermee openen we een extra scherm
  Image,               // Hiermee tonen we een foto
  useWindowDimensions, // Hiermee reageren we op schermgrootte en rotatie
} from 'react-native';

// Hiermee kunnen we de schermoriëntatie aanpassen (portrait / landscape).
import * as ScreenOrientation from 'expo-screen-orientation';
 
// MapView is de kaart.
// Marker is een pin op de kaart.
import MapView, { Marker } from 'react-native-maps';
 
// Dit is de URL van onze ASP.NET Core API.
// Via deze URL halen we bedrijven op en slaan we bedrijven op.
const API_URL = 'https://to.internus.info/api/apicompanies';
 
export default function App() {
  // Hier bewaren we alle bedrijven uit de database.
  const [companies, setCompanies] = useState([]);
 
  // Hiermee bepalen we of het formulier zichtbaar is.
  const [formVisible, setFormVisible] = useState(false);
 
  // Hiermee bepalen we of de kaart zichtbaar is.
  const [mapVisible, setMapVisible] = useState(false);
 
  // Dit zijn de velden van het formulier.
  // Elke TextInput krijgt zijn eigen state.
  const [sfCompanyId, setSfCompanyId] = useState(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [addition, setAddition] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [timeZone, setTimeZone] = useState('');
  const [now, setNow] = useState(new Date());

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
 
  // Deze useEffect draait automatisch als de app opent.
  useEffect(() => {
    loadCompanies();
 
    const timer = setInterval(() => setNow(new Date()), 1000); // 1000ms = 1 seconde
    return () => clearInterval(timer);
  }, []);

    // Buiten de kaart houden we portrait vast; op de kaart mag het scherm draaien.
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  useEffect(() => {
    if (mapVisible) {
      ScreenOrientation.unlockAsync();
    } else {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  }, [mapVisible]);
 
  // READ
  // Deze functie haalt alle bedrijven op uit de API.
  const loadCompanies = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
 
      // We stoppen de opgehaalde data in companies.
      setCompanies(data);
    } catch (error) {
      Alert.alert('Fout', 'Bedrijven konden niet worden geladen.');
    }
  };
 
  // Deze functie maakt het formulier leeg.
  const resetForm = () => {
    setSfCompanyId(null);
    setName('');
    setAddress('');
    setNumber('');
    setAddition('');
    setPostalCode('');
    setCity('');
    setCountry('');
    setLogoUrl('');
    setLatitude('');
    setLongitude('');
    setTimeZone('');
  };
 
  // Deze functie opent het formulier om een nieuw bedrijf toe te voegen.
  const openCreate = () => {
    resetForm();
    setFormVisible(true);
  };
 
  // CREATE of UPDATE
  // Deze functie slaat een bedrijf op.
  const saveCompany = async () => {
    // Eerst controleren we of verplichte velden zijn ingevuld.
    if (!name) {
      Alert.alert('Let op', 'Vul minimaal een naam in.');
      return;
    }
 
    // We maken een object van de ingevulde gegevens.
    const company = {
      name,
      address,
      number,
      addition,
      postalCode,
      city,
      country,
      logoUrl,
      latitude,
      longitude,
      timeZone,
    };
 
    // Als sfCompanyId bestaat, dan wijzigen we een bestaand bedrijf.
    if (sfCompanyId) {
      company.sfCompanyId = sfCompanyId;
    }
 
    try {
      // Als er een id is, gebruiken we PUT.
      // Zonder id gebruiken we POST.
      const response = await fetch(
        sfCompanyId ? `${API_URL}/${sfCompanyId}` : API_URL,
        {
          method: sfCompanyId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(company),
        }
      );
 
      if (!response.ok) {
        throw new Error('Opslaan mislukt');
      }
 
      // Formulier sluiten.
      setFormVisible(false);
 
      // Formulier leegmaken.
      resetForm();
 
      // Lijst opnieuw laden.
      loadCompanies();
    } catch (error) {
      Alert.alert('Fout', 'Opslaan is mislukt.');
    }
  };
 
  // Alleen bedrijven met geldige latitude en longitude komen op de kaart.
  const validCompanies = companies.filter(
    (company) =>
      company.latitude &&
      company.longitude &&
      !isNaN(parseFloat(company.latitude)) &&
      !isNaN(parseFloat(company.longitude))
  );
 
  return (
    <SafeAreaView style={styles.container}>
      {/* Header bovenaan */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMapVisible(true)}>
          <Text style={styles.headerButton}>🗺️</Text>
        </TouchableOpacity>
 
        <Text style={styles.title}>Company Map</Text>
 
        <TouchableOpacity onPress={openCreate}>
          <Text style={styles.headerButton}>＋</Text>
        </TouchableOpacity>
      </View>
 
      {/* Grid met bedrijven — 2 kolommen, 4 blokjes per scherm */}
      <FlatList
        key="grid-2col"
        data={companies}
        numColumns={2}
        keyExtractor={(item) => item.sfCompanyId.toString()}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            {item.logoUrl ? (
              <Image source={{ uri: item.logoUrl }} style={styles.photo} />
            ) : (
              <View style={styles.placeholder}>
                <Text>🏢</Text>
              </View>
            )}
 
            <View style={styles.cardText}>
              <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.sub} numberOfLines={1}>
                {item.city}{item.city && item.country ? ', ' : ''}{item.country}
              </Text>
 
              {item.timeZone ? (
                <Text style={styles.time}>
                  {(() => {
                    try {
                      return now.toLocaleTimeString('nl-NL', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                        timeZone: item.timeZone,
                      });
                    } catch {
                      return null;
                    }
                  })()}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
      />
 
      {/* Kaart scherm */}
      <Modal
        visible={mapVisible}
        animationType="slide"
        supportedOrientations={[
          'portrait',
          'portrait-upside-down',
          'landscape',
          'landscape-left',
          'landscape-right',
        ]}
      >

        <SafeAreaView style={styles.container}>
          <View style={[styles.header, isLandscape && styles.headerLandscape]}>
            <TouchableOpacity onPress={() => setMapVisible(false)}>
              <Text style={styles.closeButton}>Sluiten</Text>
            </TouchableOpacity>
 
            <Text style={styles.title}>Kaart</Text>
 
            <View style={{ width: 60 }} />
          </View>
 
          <MapView
            key={`${width}x${height}`}
            style={styles.map}
            initialRegion={{
              latitude: 52.3676,
              longitude: 4.9041,
              latitudeDelta: 5,
              longitudeDelta: 5,
            }}
          >
            {validCompanies.map((company) => (
              <Marker
                key={company.sfCompanyId}
                coordinate={{
                  latitude: parseFloat(company.latitude),
                  longitude: parseFloat(company.longitude),
                }}
                title={company.name}
                description={`${company.city}, ${company.country}`}
              />
            ))}
          </MapView>
        </SafeAreaView>
      </Modal>
 
      {/* Formulier scherm */}
      <Modal visible={formVisible} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setFormVisible(false)}>
              <Text style={styles.closeButton}>Annuleer</Text>
            </TouchableOpacity>
 
            <Text style={styles.title}>
              {sfCompanyId ? 'Wijzigen' : 'Toevoegen'}
            </Text>
 
            <TouchableOpacity onPress={saveCompany}>
              <Text style={styles.saveButton}>Opslaan</Text>
            </TouchableOpacity>
          </View>
 
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Naam"
              value={name}
              onChangeText={setName}
            />
 
            <TextInput
              style={styles.input}
              placeholder="Straat"
              value={address}
              onChangeText={setAddress}
            />
 
            <TextInput
              style={styles.input}
              placeholder="Huisnummer"
              value={number}
              onChangeText={setNumber}
            />
 
            <TextInput
              style={styles.input}
              placeholder="Toevoeging"
              value={addition}
              onChangeText={setAddition}
            />
 
            <TextInput
              style={styles.input}
              placeholder="Postcode"
              value={postalCode}
              onChangeText={setPostalCode}
            />
 
            <TextInput
              style={styles.input}
              placeholder="Stad"
              value={city}
              onChangeText={setCity}
            />
 
            <TextInput
              style={styles.input}
              placeholder="Land"
              value={country}
              onChangeText={setCountry}
            />
 
            <TextInput
              style={styles.input}
              placeholder="Logo URL"
              value={logoUrl}
              onChangeText={setLogoUrl}
            />
 
            <TextInput
              style={styles.input}
              placeholder="Latitude"
              value={latitude}
              onChangeText={setLatitude}
            />
 
            <TextInput
              style={styles.input}
              placeholder="Longitude"
              value={longitude}
              onChangeText={setLongitude}
            />
 
            <TextInput
              style={styles.input}
              placeholder="Tijdzone (bijv. Europe/Amsterdam)"
              value={timeZone}
              onChangeText={setTimeZone}
            />
 
           
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
 
// Hier staat alle styling van de app.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF1F5',
  },
 
  header: {
    height: 88,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    marginTop: 14,
    marginBottom: 12,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderWidth: 0,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 5,
  },
 
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.8,
  },
 
  headerButton: {
    fontSize: 20,
    color: '#2563EB',
    fontWeight: '600',
    backgroundColor: '#EFF6FF',
    width: 48,
    height: 48,
    lineHeight: 48,
    textAlign: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
 
  closeButton: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
 
  saveButton: {
    color: '#FFFFFF',
    backgroundColor: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
 
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
 
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
 
  card: {
    width: '48%',
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 0,
    alignItems: 'center',
    minHeight: 168,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 3,
  },
 
  cardText: {
    width: '100%',
    gap: 4,
    marginTop: 12,
    alignItems: 'center',
  },
 
  photo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
 
  placeholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
 
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
    letterSpacing: -0.3,
    lineHeight: 20,
    textAlign: 'center',
  },
 
  sub: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
    fontWeight: '400',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
 
  time: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: -0.5,
    marginTop: 6,
    textAlign: 'center',
  },
 
  form: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: '#EFF1F5',
  },
 
  input: {
    backgroundColor: '#FFFFFF',
    height: 54,
    paddingHorizontal: 20,
    borderWidth: 0,
    borderRadius: 16,
    marginBottom: 12,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '400',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
 
  deleteButton: {
    backgroundColor: '#FFFFFF',
    marginTop: 24,
    paddingVertical: 17,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
 
  deleteText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 15,
  },
 
  map: {
    flex: 1,
    backgroundColor: '#CBD5E1',
  },

  headerLandscape: {
    height: 48,
  },
});