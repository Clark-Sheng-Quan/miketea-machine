import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
  FlatList,
  TextInput,
  Modal
} from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import {
  loadQRFormula,
  generateQRStringsFromOrder,
  countValidOptionItems,
  syncQRDataFromAPI,
  getLastSyncTime
} from '../services/qrService'

const { width, height } = Dimensions.get('window')

export default function POSScreen() {
  const [orderData, setOrderData] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [formula, setFormula] = useState('#{productCode}|#{optionCodes}')
  const [qrStrings, setQrStrings] = useState([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(null)
  const [qrModalVisible, setQrModalVisible] = useState(false)
  const [selectedQRItem, setSelectedQRItem] = useState(null)
  const [apiBaseUrl, setApiBaseUrl] = useState('http://192.168.1.1:3000') // 默认本地 IP
  const [urlModalVisible, setUrlModalVisible] = useState(false)
  const [tempUrl, setTempUrl] = useState('http://192.168.1.1:3000')

  useEffect(() => {
    loadLastSync()
  }, [])

  const loadLastSync = async () => {
    const time = await getLastSyncTime()
    if (time) {
      setLastSyncTime(new Date(time))
    }
  }

  // Sync data from API
  const handleSyncData = async () => {
    try {
      setSyncing(true)
      const success = await syncQRDataFromAPI(apiBaseUrl)
      if (success) {
        await loadLastSync()
        const loadedFormula = await loadQRFormula()
        setFormula(loadedFormula)
        Alert.alert('Success', 'Data synced from API')
      } else {
        Alert.alert('Error', 'Failed to sync data')
      }
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setSyncing(false)
    }
  }

  // Load POS orders from JSON file
  const loadPOSOrders = async () => {
    try {
      // Mock order data - 在实际应用中应从本地或 API 加载
      const mockOrderData = {
        orders: [
          {
            _id: 'ORDER001',
            orderId: 'ORD123456',
            products: [
              {
                _id: 'PROD001',
                itemId: '001',
                sku: 'SKU001',
                name: 'Brown Sugar Milk Tea',
                options: [
                  {
                    _id: 'OPT001',
                    name: 'Size',
                    option_items: [
                      { _id: 'ITEM001', qty: 1, name: 'Medium' }
                    ]
                  },
                  {
                    _id: 'OPT002',
                    name: 'Sugar Level',
                    option_items: [
                      { _id: 'ITEM002', qty: 1, name: '50%' }
                    ]
                  }
                ]
              },
              {
                _id: 'PROD002',
                itemId: '002',
                sku: 'SKU002',
                name: 'Taro Milk Tea',
                options: [
                  {
                    _id: 'OPT001',
                    name: 'Size',
                    option_items: [
                      { _id: 'ITEM003', qty: 1, name: 'Large' }
                    ]
                  }
                ]
              }
            ]
          },
          {
            _id: 'ORDER002',
            orderId: 'ORD123457',
            products: [
              {
                _id: 'PROD001',
                itemId: '001',
                sku: 'SKU001',
                name: 'Brown Sugar Milk Tea',
                options: [
                  {
                    _id: 'OPT001',
                    name: 'Size',
                    option_items: [
                      { _id: 'ITEM001', qty: 1, name: 'Medium' }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }

      setOrderData(mockOrderData)
      Alert.alert('Success', 'Orders loaded')
    } catch (error) {
      Alert.alert('Error', `Failed to load orders: ${error.message}`)
    }
  }

  // Handle order selection
  const handleOrderSelect = async (value) => {
    setSelectedOrder(value)
    setQrStrings([])
    setLoading(true)

    try {
      const loadedFormula = await loadQRFormula()
      setFormula(loadedFormula)

      const order = orderData.orders[value]
      const qrList = await generateQRStringsFromOrder(order, loadedFormula)
      setQrStrings(qrList)
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleShowQRCode = (item) => {
    setSelectedQRItem(item)
    setQrModalVisible(true)
  }

  const renderQRItem = ({ item }) => (
    <TouchableOpacity
      style={styles.qrItemContainer}
      onPress={() => handleShowQRCode(item)}
    >
      <Text style={styles.productName}>{item.productName}</Text>
      <Text style={styles.qrString} numberOfLines={2}>{item.qrString}</Text>
      <View style={styles.qrPreview}>
        <QRCode
          value={item.qrString}
          size={80}
        />
      </View>
      <Text style={styles.tapText}>Tap to view full QR</Text>
    </TouchableOpacity>
  )

  return (
    <ScrollView style={styles.container}>
      {/* API URL Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Settings</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            setTempUrl(apiBaseUrl)
            setUrlModalVisible(true)
          }}
        >
          <Text style={styles.settingsButtonText}>API URL: {apiBaseUrl}</Text>
        </TouchableOpacity>
      </View>

      {/* Operations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Operations</Text>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={loadPOSOrders}
        >
          <Text style={styles.buttonText}>Load Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleSyncData}
          disabled={syncing}
        >
          <Text style={styles.buttonText}>
            {syncing ? 'Syncing...' : 'Sync API Data'}
          </Text>
        </TouchableOpacity>

        {lastSyncTime && (
          <Text style={styles.syncTime}>
            Last sync: {lastSyncTime.toLocaleString()}
          </Text>
        )}
      </View>

      {/* Order Selection */}
      {orderData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orders ({orderData.orders.length})</Text>
          <FlatList
            data={orderData.orders}
            keyExtractor={(_, idx) => idx.toString()}
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.orderItem,
                  selectedOrder === index && styles.orderItemSelected
                ]}
                onPress={() => handleOrderSelect(index)}
              >
                <Text style={styles.orderText}>
                  Order {index + 1} - {item._id.slice(0, 8)}...
                </Text>
                <Text style={styles.orderSubtext}>
                  {item.products.length} products
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Formula Display */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1890ff" />
          <Text>Generating QR strings...</Text>
        </View>
      )}

      {/* QR Strings List */}
      {qrStrings.length > 0 && !loading && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generated QR Codes ({qrStrings.length})</Text>
          <FlatList
            data={qrStrings}
            keyExtractor={(_, idx) => idx.toString()}
            scrollEnabled={false}
            renderItem={renderQRItem}
          />
        </View>
      )}

      {selectedOrder === null && !loading && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Select an order to generate QR codes</Text>
        </View>
      )}

      {/* QR Code Modal */}
      <Modal
        visible={qrModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setQrModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>

            {selectedQRItem && (
              <View style={styles.qrCodeDisplay}>
                <Text style={styles.modalTitle}>{selectedQRItem.productName}</Text>
                <View style={styles.qrCodeContainer}>
                  <QRCode
                    value={selectedQRItem.qrString}
                    size={250}
                  />
                </View>
                <Text style={styles.qrStringDisplay}>{selectedQRItem.qrString}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => {
                    // Clipboard.setString(selectedQRItem.qrString)
                    Alert.alert('Copied to clipboard', selectedQRItem.qrString)
                  }}
                >
                  <Text style={styles.copyButtonText}>Copy QR String</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* API URL Modal */}
      <Modal
        visible={urlModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set API URL</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., http://192.168.1.1:3000"
              value={tempUrl}
              onChangeText={setTempUrl}
            />
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => {
                setApiBaseUrl(tempUrl)
                setUrlModalVisible(false)
              }}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => setUrlModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333'
  },
  button: {
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8
  },
  primaryButton: {
    backgroundColor: '#1890ff'
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0'
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333'
  },
  syncTime: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 8
  },
  orderItem: {
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#d0d0d0'
  },
  orderItemSelected: {
    backgroundColor: '#e6f7ff',
    borderLeftColor: '#1890ff'
  },
  orderText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333'
  },
  orderSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 4
  },
  qrItemContainer: {
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center'
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333'
  },
  qrString: {
    fontSize: 11,
    color: '#d4380d',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'monospace'
  },
  qrPreview: {
    marginBottom: 8
  },
  tapText: {
    fontSize: 10,
    color: '#999'
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16
  },
  emptyText: {
    fontSize: 13,
    color: '#999'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    maxWidth: '90%',
    width: width - 32
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingBottom: 12
  },
  closeButtonText: {
    color: '#1890ff',
    fontSize: 14,
    fontWeight: '600'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333'
  },
  qrCodeDisplay: {
    alignItems: 'center'
  },
  qrCodeContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8
  },
  qrStringDisplay: {
    fontSize: 12,
    color: '#d4380d',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'monospace'
  },
  copyButton: {
    backgroundColor: '#1890ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center'
  },
  copyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500'
  },
  settingsButton: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginBottom: 8
  },
  settingsButtonText: {
    fontSize: 13,
    color: '#333'
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    fontSize: 13,
    color: '#333'
  }
})
