DROP TABLE IF EXISTS shelf;

CREATE TABLE shelf (
id SERIAL PRIMARY KEY,
author TEXT,
title TEXT,
isbn VARCHAR(256),
image_url TEXT,
description1 TEXT,
);
