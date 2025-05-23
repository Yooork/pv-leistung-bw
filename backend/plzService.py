from models import PLZ_PVModel
import json
class PLZService:
    def __init__(self):
        self.model = PLZ_PVModel()

    def get_all(self):
        return self.model.get_all()