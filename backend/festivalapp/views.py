from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Festival


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def listar_festivales(request):
    """Lista todos los festivales disponibles."""
    festivales = Festival.objects.all().values('id', 'nombre', 'estado')
    return Response(list(festivales))
