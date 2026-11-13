from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    nvidia_api_key: str = ""
    nvidia_model: str = "replace_with_model_id_from_nvidia_catalog"
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    database_url: str = ""
    jwt_secret: str = "development-only-change-this-secret"
    jwt_expire_minutes: int = 10080
    frontend_origin: str = "http://localhost:5173"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
