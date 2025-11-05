# How to run the backend

## Development

Install dependencies via `pip install .` in backend folder.

Edit configurations in PyCharm:
- Create virtual environment
- Set project interpreter to your virtual environment
- Edit configurations:
  - Select `Python`
  - Select Module: `uvicorn`
  - Select Script Parameters: `app.main:app --reload --host 0.0.0.0 --port 8000 --reload-dir app`

## Production

Push code to github, pull down the latest version on the AWS server.
- Run `./scripts/build-and-deploy.sh`