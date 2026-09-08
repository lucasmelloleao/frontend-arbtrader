# Taste
See [taste/taste.md](taste/taste.md)

## Communication

- Communicates in Portuguese (pt-BR) for both task requests ("precisamos agora ajustar o acesso ao backend… verifique onde é necessário atualizar") and expectations. Confidence: 0.6
- When the user notes that a shared contract/artifact may be stale ("o swagger nao estava atualizado, verifique se é necessário para as fatoracoes"), the expected response is to diff the current state against the implementation, update the frontend contract to match the freshly updated spec, and report conclusively whether any refactoring is still needed — not to treat the stale artifact as a blocking unknown. Confidence: 0.5
