import { Request, Response } from "express";
import { User } from "./user.js";
import * as app from "../app.js";

// Контроллер для входа пользователя.
export const login = async (req: Request, res: Response) => {
  try {
    const { login, pass } = req.body;

    // Поиск пользователя  с указанным логином и паролем в файле dbItems.json.
    const user = await app.findUserInDb(login, pass);

    if (user) {
      // Если пользователь найден => выполняется аутентификация.
      req.session.regenerate((error) => {
        if (error) {
          // Обработка ошибки при сессионной регенерации, если она произошла.
          console.log(`${error}`);
          return;
        }
        // Если пользователь найден, сохраняем информацию о нем в сессии.
        req.session.user = user;
        // Сохранение сессии в хранилище.
        req.session.save((err) => {
          // Обработка ошибки при сохранении сессии, если она произошла.
          console.log(`${err}`);
          res.json({ ok: true });
        });
      });
    } else {
      // Если пользователь не найден => 401 (Unauthorized).
      res.status(401).json({ ok: false });
    }
  } catch (error) {
    console.error("Error while handling 'login':", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Контроллер для выхода пользователя.
export const logout = (req: Request, res: Response) => {
  // Удаление сессии пользователя.
  req.session.destroy(() => {
    res.json({ ok: true });
  });
};

// Контроллер для регистрации нового пользователя.
export const register = async (req: Request, res: Response) => {
  try {
    const { login, pass } = req.body;

    // Проверка на наличие обязательных полей логина и пароля.
    if (!login || !pass) {
      return res.status(400).json({ error: "Логин и пароль обязательны" });
    }

    // Загрузка пользователей из базы данных.
    const users = await app.loadUsersFromDb();

    // Проверка, существует ли пользователь с таким логином.
    const existingUser = users.find((user: any) => user.login === login);
    if (existingUser) {
      // Если пользователь с таким логином уже существует, возвращаем ошибку.
      return res
        .status(400)
        .json({ error: "Пользователь с таким логином уже существует" });
    }

    // Регистрация нового пользователя (запись в файл для хранения).
    await app.registerUser(login, pass);

    res.json({ ok: true });
  } catch (error) {
    console.error("Error while handling 'register':", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
