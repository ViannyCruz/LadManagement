import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

// Interfaz para las reservas
interface Reservation {
  date: string;
  reservation_id: string;
  status: string;
  hour: string;
  creation_timestamp: string;
  student_id: string;
  email: string;
  name: string;
  lab: string;
}

// Interfaz para el formulario de nueva reserva
interface NewReservation {
  student_id: string;
  name: string;
  lab: string;
  date: string;
  hour: number; // Cambiado a número
  email: string;
}

// Componente principal
function App() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [newReservation, setNewReservation] = useState<NewReservation>({
    student_id: "",
    name: "",
    lab: "",
    date: "",
    hour: 0, // Cambiado a número
    email: "",
  });
  const [showPastReservations, setShowPastReservations] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });

  // Lista de laboratorios disponibles
  const availableLabs = [
    "Laboratorio de Informática",
    "Laboratorio de Química",
    "Laboratorio de Física",
    "Laboratorio de Biología",
    "Laboratorio de Electrónica",
  ];

  // Función para obtener las reservas activas
  const getReservations = async (): Promise<Reservation[]> => {
    const response = await fetch(
      "https://1mhxam8ej3.execute-api.us-east-1.amazonaws.com/dev02/reservations"
    );
    const data = await response.json();
    return data.active_reservations;
  };

  // Función para obtener las reservas pasadas
  const getPastReservations = async (
    startDate: string,
    endDate: string
  ): Promise<Reservation[]> => {
    const response = await fetch(
      `https://1mhxam8ej3.execute-api.us-east-1.amazonaws.com/dev02/past-reservations?startDate=${startDate}&endDate=${endDate}`
    );
    const data = await response.json();
    return data.reservations;
  };

  // Consulta para obtener las reservas activas o pasadas
  const { data, isPending, error, refetch } = useQuery<Reservation[]>({
    queryKey: ["reservations", showPastReservations, dateRange],
    queryFn: async () => {
      if (showPastReservations) {
        if (!dateRange.startDate || !dateRange.endDate) {
          return []; // No hacer la solicitud si no hay fechas
        }
        return await getPastReservations(
          dateRange.startDate,
          dateRange.endDate
        );
      } else {
        return await getReservations();
      }
    },
    enabled: false, // Deshabilitar la ejecución automática
  });

  // Mutación para crear una nueva reserva
  const createReservationMutation = useMutation({
    mutationFn: async (reservation: NewReservation) => {
      console.log("Sending reservation:", reservation); // Depuración
      const response = await fetch(
        "https://1mhxam8ej3.execute-api.us-east-1.amazonaws.com/dev02/reservation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reservation),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData); // Depuración
        throw new Error(errorData.message || "Error al crear la reserva");
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Reservation created successfully:", data); // Depuración
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      setShowModal(false);
      setNewReservation({
        student_id: "",
        name: "",
        lab: "",
        date: "",
        hour: 0, // Reinicia a número
        email: "",
      });
    },
  });

  // Manejar cambios en el formulario
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setNewReservation((prev) => ({ ...prev, [name]: value }));
  };

  // Manejar cambios en el rango de fechas
  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
  };

  // Manejar envío del formulario de rango de fechas
  const handleDateRangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDateRangeModal(false);
    refetch(); // Recargar los datos con el nuevo rango de fechas
  };

  // Manejar envío del formulario de nueva reserva
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reservationToSend = {
      ...newReservation,
      hour: parseInt(newReservation.hour.toString().split(":")[0]), // Convierte "08:00" a 8
    };
    createReservationMutation.mutate(reservationToSend);
  };

  // Cambiar entre reservas activas y pasadas
  const toggleReservations = () => {
    if (!showPastReservations) {
      setShowDateRangeModal(true); // Mostrar el modal para ingresar fechas
    } else {
      setDateRange({ startDate: "", endDate: "" }); // Reiniciar el rango de fechas
      refetch(); // Forzar la recarga de las reservas activas
    }
    setShowPastReservations(!showPastReservations);
  };

  // Efecto para cargar las reservas activas al inicio
  useEffect(() => {
    if (!showPastReservations) {
      refetch(); // Cargar las reservas activas al inicio
    }
  }, [showPastReservations, refetch]);

  if (error) {
    return (
      <div className="alert alert-danger">Algo salió mal: {error.message}</div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg bg-body-tertiary">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            ReservasLab
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <form className="d-flex" role="search">
            <button
              className="btn btn-success"
              type="button"
              onClick={toggleReservations}
            >
              {showPastReservations ? "Reservas Activas" : "Reservas Pasadas"}
            </button>
          </form>
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="container-fluid flex-grow-1 p-4 bg-light">
        <h1 className="text-center mb-4">
          {showPastReservations
            ? "Reservas Pasadas"
            : "Reservas de Laboratorio"}
        </h1>
        {!showPastReservations && (
          <button
            className="btn btn-primary me-auto mt-4 mb-4"
            type="button"
            onClick={() => setShowModal(true)}
          >
            Agregar Reserva
          </button>
        )}
        {isPending ? (
          <div className="text-center">Cargando...</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Hora</th>
                  <th scope="col">ID Estudiante</th>{" "}
                  <th scope="col">Estudiante</th>
                  <th scope="col">Email</th>
                  <th scope="col">Laboratorio</th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((reservation: Reservation) => (
                  <tr key={reservation.reservation_id}>
                    <td>{reservation.date}</td>
                    <td>{reservation.hour}</td>
                    <td>{reservation.student_id}</td>
                    <td>{reservation.name}</td>
                    <td>{reservation.email}</td>
                    <td>{reservation.lab}</td>
                    <td>{reservation.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para agregar reserva */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Nueva Reserva</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>ID de Estudiante</Form.Label>
              <Form.Control
                type="text"
                name="student_id"
                value={newReservation.student_id}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newReservation.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={newReservation.email}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Laboratorio</Form.Label>
              <Form.Select
                name="lab"
                value={newReservation.lab}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleccionar laboratorio</option>
                {availableLabs.map((lab) => (
                  <option key={lab} value={lab}>
                    {lab}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Fecha</Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={newReservation.date}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Hora (8-21)</Form.Label>
              <Form.Control
                type="number"
                name="hour"
                value={newReservation.hour}
                onChange={handleInputChange}
                min={8}
                max={21}
                required
              />
              {newReservation.hour < 8 || newReservation.hour > 21 ? (
                <Form.Text className="text-danger">
                  La hora debe estar entre 8 y 21.
                </Form.Text>
              ) : null}
            </Form.Group>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={createReservationMutation.isPending}
              >
                {createReservationMutation.isPending
                  ? "Guardando..."
                  : "Guardar Reserva"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal para ingresar rango de fechas */}
      <Modal
        show={showDateRangeModal}
        onHide={() => {
          setShowDateRangeModal(false); // Cierra el modal
          toggleReservations(); // Vuelve a la vista de reservas activas
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Seleccionar Rango de Fechas</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleDateRangeSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Fecha de Inicio</Form.Label>
              <Form.Control
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateRangeChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Fecha de Fin</Form.Label>
              <Form.Control
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateRangeChange}
                required
              />
            </Form.Group>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDateRangeModal(false); // Cierra el modal
                  toggleReservations(); // Vuelve a la vista de reservas activas
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                Aplicar
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Footer */}
      <footer className="bg-body-tertiary text-center p-3">
        <p className="mb-0">
          © 2023 ReservasLab. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}

export default App;
