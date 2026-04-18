from django.urls import path
from .views import LoginAdminView, LogoutView, PanelAdminView
from .views import (
    ResetPasswordAPI,
    ConfirmResetPasswordAPI
)

urlpatterns = [
    path("login/", LoginAdminView.as_view(), name="login-admin"),
    path("panel/", PanelAdminView.as_view(), name="panel-admin"),
    path('ForgotPassword/', ResetPasswordAPI.as_view(), name='reset-password'),
    path("reset-password/confirm/", ConfirmResetPasswordAPI.as_view(), name="confirm-reset-password"),
     path("logout/",LogoutView.as_view(),     name="logout"), 
]