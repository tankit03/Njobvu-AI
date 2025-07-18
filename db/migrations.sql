CREATE TABLE Users (Username TEXT NOT NULL PRIMARY KEY, Password TEXT NOT NULL, FirstName TEXT NOT NULL, LastName TEXT NOT NULL, Email TEXT);
INSERT INTO Users (Username, Password, FirstName, LastName, Email) VALUES ('ZeroUser', 'Temp123', 'ZeroUser', 'ZeroUser', 'ZeroUser');
CREATE TABLE Projects (PName VARCHAR NOT NULL, PDescription VARCHAR NOT NULL, AutoSave INTEGER NOT NULL DEFAULT 0, Admin TEXT NOT NULL DEFAULT 'ZeroUser', Validate VARCHAR NOT NULL DEFAULT 0, FOREIGN KEY(Admin) REFERENCES Users(Username), PRIMARY KEY(PName, Admin));
CREATE TABLE Access (Username TEXT NOT NULL, PName VARCHAR NOT NULL,  Admin TEXT NOT NULL, FOREIGN KEY(Username) REFERENCES Users(Username), FOREIGN KEY(PName) REFERENCES Projects(PName), FOREIGN KEY(Admin) REFERENCES Projects(Admin));
