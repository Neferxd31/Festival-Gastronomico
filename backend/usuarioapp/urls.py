from django.urls import path
from .views import LoginAdminView, PanelAdminView

urlpatterns = [
    path("login/", LoginAdminView.as_view(), name="login-admin"),
    path("panel/", PanelAdminView.as_view(), name="panel-admin"),
]