# get mock gps data
# random latitude and longitude data from Newark, Delaware
class GPSData:
    def __init__(self, latitude=39.7684, longitude=-75.1698):
        self.latitude = latitude
        self.longitude = longitude

    def setLatitude(self, latitude):
        self.latitude = latitude
    
    def setLongitude(self, longitude):
        self.longitude = longitude

    def getLatitude(self):
        return self.latitude
    
    def getLongitude(self):
        return self.longitude
        