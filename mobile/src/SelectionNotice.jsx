import { Modal, Platform, StyleSheet, Text, View } from 'react-native';
import Button from './Button';

export default function SelectionNotice({ visible, title, accept, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={s.backdrop}>
        <View style={s.card} accessibilityViewIsModal>
          <Text style={s.brand}>KelseTS Maison</Text>
          <Text accessibilityRole="header" style={s.title}>
            {title}
          </Text>
          <Button onPress={onClose}>{accept}</Button>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#00000066',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    padding: 24,
    gap: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d9d4ca',
    backgroundColor: '#f6f4ee',
  },
  brand: { color: '#b3152b', fontSize: 13, letterSpacing: 1.5 },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#242320',
    fontSize: 26,
  },
});
