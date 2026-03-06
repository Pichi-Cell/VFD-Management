

# Informe Variador 1010
27/2/26 - Departamento de desarrollo - DMD Compresores

---
Responsable: Lucas Picchi
Variador de frecuencia 1010
S/N: 5506107000F
cliente: ROS AR S.A
# 1. Estado del dispositivo
#### 1.1 Características eléctricas
_El variador cuenta con las siguientes especificaciones eléctricas:_

| Parámetro                  | Valor         |
| -------------------------- | ------------- |
| Potencia                   | 37 kW         |
| Frecuencia de alimentación | 50/60Hz       |
| Tensión de alimentación    | 3x380-480V    |
| Modelo                     | SV0373iS7-4NO |
| Marca                      | LS            |

#### 1.2 Estado de ingreso
_Al momento del ingreso, el variador reporta lo siguiente:_

| Parámetro          | Valor    |
| ------------------ | -------- |
| Edad               | 9 años   |
| Horas de ejecución | 15484 hs |
| Horas de conexión  | 61919 hs |

#### 1.3 Historial de fallas
_El equipo reporta el siguiente historial de fallas:_

| REGISTROS | FALLA     | HORAS DE FALLA |
| --------- | --------- | -------------- |
| 1         | SOBRETEMP | 1997           |
| 2         | SOBRETEMP | 1997           |
| 3         | SOBRETEMP | 1996           |
| 4         | SOBRETEMP | 1995           |
#### 1.4 Reporte de falla
_Se reportó al departamento de desarrollo la siguiente falla:_

"El cliente acusa alarmas de sobre temperatura "
# 2. Procedimiento 
_Con la información proveída por los técnicos, se determinó el procedimiento a seguir:_
#### 2.1 Desarmado
_Se desarmó el variador para confirmar su estado interno, durante el proceso se realizaron las siguientes observaciones:_

- El variador presentaba una acumulación de suciedad reducida
- La inspección visual no evidenció ningún tipo de marcas de recalentamiento o sobre temperatura.
  
  ![](Pasted%20image%2020260227141146.png)
  _Estado interno del equipo_

- Buen estado general del equipo.

#### 2.2 Medición
_Se procedió a medir los componentes mas importantes para el funcionamiento del variador, se realizaron las siguientes observaciones:_

- Los módulos rectificadores y los IGBT se encuentran en buen estado.
- Los capacitores se encuentran al 94%.
#### 2.3 Testeo
_Se procedió a probar el equipo en el laboratorio de desarrollo, dónde se hicieron las siguientes observaciones:_

- Se sometió al variador a pruebas en vacío, con carga nominal y con carga mayor para exigirlo durante un tiempo extendido, pero no se pudo replicar la falla reportada por el cliente.
# 3. Diagnóstico
_Con la información reunida, se propone lo siguiente:_

- Considerando que el equipo ya ha presentado fallas en el circuito de control en el pasado, la falla probablemente sea debido a un desgaste del mismo causado por la gran cantidad de horas de conexión.
# 4. Conclusión

| Componente           | Estado | Observaciones              | Solución Propuesta |
| -------------------- | ------ | -------------------------- | ------------------ |
| Carcasa              | OK     |                            |                    |
| Cooler               | OK     |                            |                    |
| IGBT                 | OK     |                            |                    |
| Placa de control     | OK*    | Fue reemplazada en el 2024 |                    |
| Placa de potencia    | OK     |                            |                    |
| Banco de capacitores | OK     |                            |                    |

Conclusión final: 

Teniendo en cuenta todo lo propuesto anteriormente, y que el variador está excedido en su vida útil (61,000 Horas de conexion y 9 años de servicio), **Se recomienda el reemplazo de la unidad**

