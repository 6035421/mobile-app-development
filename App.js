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
  Image,             // Hiermee tonen we een foto
} from 'react-native';

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

  // Deze useEffect draait automatisch als de app opent.
  useEffect(() => {
    loadCompanies();

    const timer = setInterval(() => setNow(new Date()), 1000); // 1000ms = 1 seconde
    return () => clearInterval(timer);
  }, []);

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

      {/* Lijst met bedrijven */}
      <FlatList
        data={companies}
        keyExtractor={(item) => item.sfCompanyId.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} >
            {item.logoUrl ? (
              <Image source={{ uri: item.logoUrl }} style={styles.photo} />
            ) : (
              <View style={styles.placeholder}>
                <Text>🏢</Text>
              </View>
            )}

            <View style={styles.cardText}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>{item.city}{item.city && item.country ? ', ' : ''}{item.country}</Text>
              <Text style={styles.sub}>{item.address} {item.number}{item.addition ? ` ${item.addition}` : ''}</Text>


              <Text style={styles.sub}>{item.timeZone ? (() => {
                  try {
                    const localTime = now.toLocaleTimeString('nl-NL', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                      timeZone: item.timeZone,
                    });
                    return <Text style={styles.sub}>Lokale tijd: {localTime}</Text>;
                  } catch {
                    return null;
                  }
                })() : null}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Kaart scherm */}
      <Modal visible={mapVisible} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setMapVisible(false)}>
              <Text style={styles.closeButton}>Sluiten</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Kaart</Text>

            <View style={{ width: 60 }} />
          </View>

          <MapView
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
    backgroundColor: '#f4f6f8',
  },

  header: {
    height: 55,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
  },

  headerButton: {
    fontSize: 28,
    color: '#007aff',
  },

  closeButton: {
    color: '#007aff',
    fontSize: 16,
  },

  saveButton: {
    color: '#007aff',
    fontSize: 16,
    fontWeight: '600',
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },

  cardText: {
    flex: 1,
  },

  photo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },

  placeholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  name: {
    fontSize: 17,
    fontWeight: '600',
  },

  sub: {
    fontSize: 13,
    color: '#666',
  },

  form: {
    padding: 15,
  },

  input: {
    backgroundColor: '#fff',
    height: 45,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 8,
  },

  deleteButton: {
    backgroundColor: '#fff',
    marginTop: 25,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },

  deleteText: {
    color: '#dc2626',
    fontWeight: '700',
  },

  map: {
    flex: 1,
  },
});