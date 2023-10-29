const express = require("express");
const crypto = require("node:crypto");
const movies = require("./movies.json");
const { validateMovie, validatePartialMovie } = require("./schemas/movies");
const cors = require("cors");

const app = express();
app.disable("x-powered-by");

// middleware for getting the body in a POST operation
app.use(express.json());
app.use(
	cors({
		origin: (origin, callback) => {
			const ACCEPTED_ORIGINS = [
				"http://localhost:3000",
				"http://localhost:11558",
				"http://movies.com",
			];

			if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
				return callback(null, true);
			}

			return callback(new Error("Not allowed by CORS"));
		},
	})
);

// endpoint /movies -> al resources that are movies
app.get("/movies", (req, res) => {
	// const origin = req.header("origin");
	// if (ACCEPTED_ORIGINS.includes(origin) || !origin)
	// 	res.header("Access-Control-Allow-Origin", origin);

	const { genre } = req.query;

	if (genre) {
		const filteredMovies = movies.filter((movie) =>
			movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
		);
		return res.json(filteredMovies);
	}
	res.json(movies);
});

// dynamic routes
app.get("/movies/:id", (req, res) => {
	//path-to-regexp
	const { id } = req.params;

	const movie = movies.find((movie) => movie.id === id);
	if (movie) return res.json(movie);

	res.status(404).json({ message: "Movie not found" });
});

app.post("/movies", (req, res) => {
	const result = validateMovie(req.body);

	if (result.error) {
		// 422 Unprocessable Entity could be used as well
		return res
			.status(422)
			.json({ error: JSON.parse(result.error.message) });
	}

	const newMovie = {
		id: crypto.randomUUID(),
		...result.data,
	};

	// this is not REST
	// cuz we are storing the app state in memory
	movies.push(newMovie);

	res.status(201).json(newMovie); // update the client cache
});

app.patch("/movies/:id", (req, res) => {
	const result = validatePartialMovie(req.body);

	if (!result.success) {
		return res
			.status(400)
			.json({ error: JSON.parse(result.error.message) });
	}

	const { id } = req.params;
	const movieIndex = movies.findIndex((movie) => movie.id === id);
	if (movieIndex === -1)
		return res.status(404).json({ message: "Movie not found" });

	const updateMovie = {
		...movies[movieIndex],
		...result.data,
	};

	movies[movieIndex] = updateMovie;

	return res.json(updateMovie);
});

app.delete("/movies/:id", (req, res) => {
	const { id } = req.params;
	const movieIndex = movies.findIndex((movie) => movie.id === id);

	if (movieIndex === -1) {
		return res.status(404).json({ message: "Movie not found" });
	}

	movies.splice(movieIndex, 1);

	return res.json({ message: "Movie deleted" });
});

// app.options("/movies/:id", (req, res) => {
// 	const origin = req.header("origin");

// 	if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
// 		res.header("Access-Control-Allow-Origin", origin);
// 		res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
// 	}

// 	res.sendStatus(200);
// });

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
	console.log(`server listen on port http://localhost:${PORT}`);
});
